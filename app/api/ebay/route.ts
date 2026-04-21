import { NextRequest, NextResponse } from "next/server";

import {
  buildRequestBody,
  buildTradingXmlRequestBody,
  buildRequestUrl,
  getCallDefinition,
  type ApiCallDefinition,
  type EnvironmentConfig,
  usesTradingXmlProtocol,
} from "@/lib/ebay-apis";

type ProxyBody = {
  callId?: string;
  config?: Partial<EnvironmentConfig>;
  params?: Record<string, string>;
};

type CredentialConfigField =
  | "appId"
  | "devId"
  | "certId"
  | "userAccessToken";

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

function resolveEnvironment(config?: Partial<EnvironmentConfig>) {
  const configuredEnvironment = config?.environment ?? process.env.EBAY_ENVIRONMENT;
  return configuredEnvironment === "sandbox" ? "sandbox" : "production";
}

function getEnvironmentPrefixes(environment: EnvironmentConfig["environment"]) {
  return environment === "sandbox" ? ["SANDBOX"] : ["PRODUCTION"];
}

function getConfigFieldCandidates(
  key: CredentialConfigField,
  environment: EnvironmentConfig["environment"],
) {
  const environmentPrefixes = getEnvironmentPrefixes(environment);

  switch (key) {
    case "appId":
      return [
        ...environmentPrefixes.flatMap((prefix) => [`${prefix}_APP_ID`, `EBAY_${prefix}_APP_ID`]),
        "APP_ID",
        "EBAY_APP_ID",
      ];
    case "devId":
      return [
        ...environmentPrefixes.flatMap((prefix) => [`${prefix}_DEV_ID`, `EBAY_${prefix}_DEV_ID`]),
        "DEV_ID",
        "EBAY_DEV_ID",
      ];
    case "certId":
      return [
        ...environmentPrefixes.flatMap((prefix) => [
          `${prefix}_CERT_ID`,
          `EBAY_${prefix}_CERT_ID`,
        ]),
        "CERT_ID",
        "EBAY_CERT_ID",
      ];
    case "userAccessToken":
      return environmentPrefixes.flatMap((prefix) => [
        `${prefix}_USER_ACCESS_TOKEN`,
        `EBAY_${prefix}_USER_ACCESS_TOKEN`,
      ]);
    default:
      return [];
  }
}

function getConfigValueFromEnv(
  key: CredentialConfigField,
  environment: EnvironmentConfig["environment"],
) {
  for (const candidate of getConfigFieldCandidates(key, environment)) {
    const value = process.env[candidate]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveConfig(config?: Partial<EnvironmentConfig>): EnvironmentConfig {
  const environment = resolveEnvironment(config);

  return {
    environment,
    appId: config?.appId?.trim() || getConfigValueFromEnv("appId", environment) || "",
    devId: config?.devId?.trim() || getConfigValueFromEnv("devId", environment) || "",
    certId: config?.certId?.trim() || getConfigValueFromEnv("certId", environment) || "",
    userAccessToken:
      config?.userAccessToken?.trim() ||
      getConfigValueFromEnv("userAccessToken", environment) ||
      "",
    requestLocale:
      config?.requestLocale?.trim() ||
      process.env.REQUEST_LOCALE?.trim() ||
      process.env.ACCEPT_LANGUAGE?.trim() ||
      "en-US",
    oauthUserScopes:
      config?.oauthUserScopes?.trim() || process.env.OAUTH_USER_SCOPES?.trim() || "",
    oauthAuthorizeUrlBase:
      config?.oauthAuthorizeUrlBase?.trim() ||
      process.env.OAUTH_AUTHORIZE_URL_BASE?.trim() ||
      "https://auth.ebay.com/oauth2/authorize",
  };
}

function usesApplicationToken(call: ApiCallDefinition) {
  return call.authFlow === "application";
}

function extractXmlTagValues(xml: string, tagName: string) {
  const matcher = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "g");
  const values: string[] = [];

  for (const match of xml.matchAll(matcher)) {
    const value = match[1]?.trim();
    if (value) {
      values.push(value);
    }
  }

  return values;
}

function extractXmlTagValue(xml: string, tagName: string) {
  return extractXmlTagValues(xml, tagName)[0];
}

function parseTradingXmlResponse(rawXml: string) {
  const errorBlocks = [...rawXml.matchAll(/<Errors>([\s\S]*?)<\/Errors>/g)].map((match) => {
    const block = match[1] ?? "";

    return {
      shortMessage: extractXmlTagValue(block, "ShortMessage"),
      longMessage: extractXmlTagValue(block, "LongMessage"),
      errorCode: extractXmlTagValue(block, "ErrorCode"),
      severityCode: extractXmlTagValue(block, "SeverityCode"),
      errorClassification: extractXmlTagValue(block, "ErrorClassification"),
    };
  });

  return {
    format: "xml" as const,
    ack: extractXmlTagValue(rawXml, "Ack") ?? null,
    correlationId: extractXmlTagValue(rawXml, "CorrelationID") ?? null,
    timestamp: extractXmlTagValue(rawXml, "Timestamp") ?? null,
    version: extractXmlTagValue(rawXml, "Version") ?? null,
    build: extractXmlTagValue(rawXml, "Build") ?? null,
    errors: errorBlocks,
    rawXml,
  };
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

  const config = resolveConfig(body.config);

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

  if (!usesApplicationToken(call) && !normalizeAccessToken(config.userAccessToken ?? "")) {
    return errorResponse("A USER_ACCESS_TOKEN is required to call the eBay APIs.");
  }

  const params = body.params ?? {};

  for (const field of call.fields) {
    if (field.required && !params[field.key]?.trim()) {
      return errorResponse(`${field.label} is required for ${call.title}.`);
    }
  }

  const requestUrl = buildRequestUrl(call, config.environment, params);

  let requestBody: unknown;
  try {
    requestBody = usesTradingXmlProtocol(call)
      ? buildTradingXmlRequestBody(call, params, requestLocale)
      : buildRequestBody(call, params);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to parse the request body.",
    );
  }

  try {
    let accessToken = normalizeAccessToken(config.userAccessToken ?? "");

    if (usesApplicationToken(call)) {
      try {
        accessToken = await getApplicationAccessToken(call, config);
      } catch (error) {
        if (!accessToken) {
          throw error;
        }
      }
    }

    const headers = usesTradingXmlProtocol(call)
      ? new Headers({
          Accept: "application/xml",
          "Content-Type": "text/xml; charset=utf-8",
          "X-EBAY-API-CALL-NAME": call.tradingCallName ?? call.title,
          "X-EBAY-API-COMPATIBILITY-LEVEL":
            call.tradingCompatibilityLevel ?? "1451",
          "X-EBAY-API-SITEID": call.tradingSiteId ?? "0",
          "X-EBAY-API-IAF-TOKEN": accessToken,
        })
      : new Headers({
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": requestLocale,
          "Content-Language": requestLocale,
        });

    if (
      !usesTradingXmlProtocol(call) &&
      requestBody !== undefined &&
      (call.method === "POST" || call.method === "PUT")
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (!usesTradingXmlProtocol(call) && call.id === "browse-get-item-by-legacy-id") {
      headers.set(
        "X-EBAY-C-MARKETPLACE-ID",
        params.marketplace_id?.trim() || "EBAY_US",
      );
    }

    const ebayResponse = await fetch(requestUrl, {
      method: call.method,
      headers,
      body:
        requestBody !== undefined && (call.method === "POST" || call.method === "PUT")
          ? usesTradingXmlProtocol(call)
            ? String(requestBody)
            : JSON.stringify(requestBody)
          : undefined,
      cache: "no-store",
    });

    const rawText = await ebayResponse.text();
    const data: unknown = usesTradingXmlProtocol(call)
      ? parseTradingXmlResponse(rawText)
      : rawText
        ? (() => {
            try {
              return JSON.parse(rawText);
            } catch {
              return { raw: rawText };
            }
          })()
        : null;
    const tradingAck =
      usesTradingXmlProtocol(call) &&
      data &&
      typeof data === "object" &&
      "ack" in data &&
      typeof data.ack === "string"
        ? data.ack
        : null;
    const isSuccessfulTradingAck =
      tradingAck === null || tradingAck === "Success" || tradingAck === "Warning";
    const isProxySuccess = ebayResponse.ok && isSuccessfulTradingAck;

    return NextResponse.json(
      {
        ok: isProxySuccess,
        status: ebayResponse.status,
        statusText: ebayResponse.statusText,
        requestUrl: requestUrl.toString(),
        data,
      },
      {
        status: isProxySuccess ? 200 : ebayResponse.ok ? 400 : ebayResponse.status,
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
