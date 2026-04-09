import { NextRequest, NextResponse } from "next/server";

import {
  buildRequestBody,
  buildRequestUrl,
  getCallDefinition,
  type ApiCallDefinition,
  type EnvironmentConfig,
} from "@/lib/ebay-apis";

type ProxyBody = {
  callId?: string;
  config?: Partial<EnvironmentConfig>;
  params?: Record<string, string>;
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getOauthBaseUrl(environment: EnvironmentConfig["environment"]) {
  return environment === "sandbox"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";
}

function normalizeAccessToken(token: string) {
  return token.trim().replace(/^Bearer\s+/i, "");
}

function usesApplicationToken(call: ApiCallDefinition) {
  return call.requiredScopes.some(
    (scope) =>
      scope === "https://api.ebay.com/oauth/api_scope" &&
      !scope.includes("/sell."),
  );
}

async function getApplicationAccessToken(
  call: ApiCallDefinition,
  config: Partial<EnvironmentConfig>,
) {
  const appId = config.appId?.trim();
  const certId = config.certId?.trim();

  if (!appId || !certId) {
    throw new Error(
      `APP_ID and CERT_ID are required to generate an application token for ${call.title}.`,
    );
  }

  const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");
  const oauthUrl = new URL("/identity/v1/oauth2/token", getOauthBaseUrl(config.environment!));
  const tokenResponse = await fetch(oauthUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: call.requiredScopes.join(" "),
    }).toString(),
    cache: "no-store",
  });

  const rawText = await tokenResponse.text();
  let data: unknown = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }
  }

  if (
    !tokenResponse.ok ||
    typeof data !== "object" ||
    data === null ||
    !("access_token" in data) ||
    typeof data.access_token !== "string"
  ) {
    const detail =
      data && typeof data === "object" ? JSON.stringify(data, null, 2) : rawText || "No response body.";

    throw new Error(`Unable to generate an application token for ${call.title}.\n\n${detail}`);
  }

  return data.access_token;
}

export async function POST(request: NextRequest) {
  let body: ProxyBody;

  try {
    body = (await request.json()) as ProxyBody;
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  const call = body.callId ? getCallDefinition(body.callId) : undefined;
  if (!call) {
    return errorResponse("Unknown eBay API call selection.");
  }

  const config = body.config;
  if (!config?.environment || !["sandbox", "production"].includes(config.environment)) {
    return errorResponse("Select either sandbox or production before submitting.");
  }

  if (!usesApplicationToken(call) && !normalizeAccessToken(config.userAccessToken ?? "")) {
    return errorResponse("A USER_ACCESS_TOKEN is required to call the eBay APIs.");
  }

  const requestLocale = config.requestLocale?.trim() || "en-US";
  if (!/^[a-z]{2}-[A-Z]{2}$/.test(requestLocale)) {
    return errorResponse(
      "REQUEST_LOCALE must be a valid locale like en-US or fr-CA.",
    );
  }

  if (config.environment === "sandbox" && !call.sandboxSupported) {
    return errorResponse(
      `${call.title} is documented by eBay as unsupported in Sandbox.`,
    );
  }

  const params = body.params ?? {};

  for (const field of call.fields) {
    if (field.required && !params[field.key]?.trim()) {
      return errorResponse(`${field.label} is required for ${call.title}.`);
    }
  }

  const requestUrl = buildRequestUrl(call, config.environment, params);
  const requestBody = buildRequestBody(call, params);

  try {
    const accessToken = usesApplicationToken(call)
      ? await getApplicationAccessToken(call, config)
      : normalizeAccessToken(config.userAccessToken ?? "");

    const headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": requestLocale,
      "Content-Language": requestLocale,
    });

    if (call.method === "POST") {
      headers.set("Content-Type", "application/json");
    }

    if (call.id === "browse-get-item-by-legacy-id") {
      headers.set(
        "X-EBAY-C-MARKETPLACE-ID",
        params.marketplace_id?.trim() || "EBAY_US",
      );
    }

    const ebayResponse = await fetch(requestUrl, {
      method: call.method,
      headers,
      body: call.method === "POST" ? JSON.stringify(requestBody) : undefined,
      cache: "no-store",
    });

    const rawText = await ebayResponse.text();
    let data: unknown = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }
    }

    return NextResponse.json(
      {
        ok: ebayResponse.ok,
        status: ebayResponse.status,
        statusText: ebayResponse.statusText,
        requestUrl: requestUrl.toString(),
        data,
      },
      {
        status: ebayResponse.ok ? 200 : ebayResponse.status,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to reach the eBay API from the server route.";

    return errorResponse(message, 502);
  }
}
