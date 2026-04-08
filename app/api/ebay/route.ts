import { NextRequest, NextResponse } from "next/server";

import {
  buildRequestBody,
  buildRequestUrl,
  getCallDefinition,
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

  if (!config.userAccessToken?.trim()) {
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
    const ebayResponse = await fetch(requestUrl, {
      method: call.method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.userAccessToken.trim()}`,
        "Accept-Language": requestLocale,
        "Content-Language": requestLocale,
        ...(call.method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
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
