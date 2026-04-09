"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

import {
  API_CALLS,
  API_FAMILIES,
  DEFAULT_ENVIRONMENT_CONFIG,
  getCallDefaults,
  type ApiFamilyId,
  type ApiFieldDefinition,
  type EbayEnvironment,
  type EnvironmentConfig,
} from "@/lib/ebay-apis";

const SESSION_STORAGE_KEY = "ebay-inventory-workbench:env";
const FINDER_ENV_COMMAND =
  "defaults write com.apple.finder AppleShowAllFiles -bool true && killall Finder";

type ResponseState = {
  ok: boolean;
  status: number;
  statusText: string;
  requestUrl?: string;
  body: string;
};

type AlertState = {
  title: string;
  detail?: string;
};

type CredentialField = "appId" | "devId" | "certId" | "userAccessToken";
type EnvironmentCredentialProfiles = Record<
  EbayEnvironment,
  Pick<EnvironmentConfig, CredentialField>
>;
type ParsedEnvFile = {
  config: Partial<EnvironmentConfig>;
  credentialProfiles: EnvironmentCredentialProfiles;
  genericCredentials: Partial<Pick<EnvironmentConfig, CredentialField>>;
};
type SessionState = {
  config: EnvironmentConfig;
  credentialProfiles: EnvironmentCredentialProfiles;
};

const DEFAULT_CREDENTIAL_PROFILES: EnvironmentCredentialProfiles = {
  production: {
    appId: "",
    devId: "",
    certId: "",
    userAccessToken: "",
  },
  sandbox: {
    appId: "",
    devId: "",
    certId: "",
    userAccessToken: "",
  },
};

function findFamilyCall(familyId: ApiFamilyId) {
  return API_CALLS.find((call) => call.apiFamily === familyId) ?? API_CALLS[0];
}

function coerceEnvironment(input: string): EnvironmentConfig["environment"] {
  return input.toLowerCase() === "sandbox" ? "sandbox" : "production";
}

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function isCredentialField(value: string): value is CredentialField {
  return (
    value === "appId" ||
    value === "devId" ||
    value === "certId" ||
    value === "userAccessToken"
  );
}

function getCredentialFieldFromKey(key: string): CredentialField | null {
  switch (key) {
    case "APP_ID":
    case "EBAY_APP_ID":
      return "appId";
    case "DEV_ID":
    case "EBAY_DEV_ID":
      return "devId";
    case "CERT_ID":
    case "EBAY_CERT_ID":
      return "certId";
    case "USER_ACCESS_TOKEN":
    case "EBAY_USER_ACCESS_TOKEN":
      return "userAccessToken";
    default:
      return null;
  }
}

function getEnvironmentPrefix(prefix: string): EbayEnvironment | null {
  switch (prefix) {
    case "PRODUCTION":
    case "PROD":
    case "LIVE":
      return "production";
    case "SANDBOX":
    case "SBX":
      return "sandbox";
    default:
      return null;
  }
}

function getCredentialMatch(rawKey: string) {
  const upperKey = rawKey.toUpperCase();
  if (upperKey === "USER_ACCESS_TOKEN" || upperKey === "EBAY_USER_ACCESS_TOKEN") {
    return null;
  }

  const directField = getCredentialFieldFromKey(upperKey);
  if (directField) {
    return { field: directField, environment: null as EbayEnvironment | null };
  }

  const envSpecificMatch = upperKey.match(
    /^(?:(EBAY)_)?(PRODUCTION|PROD|LIVE|SANDBOX|SBX)_(APP_ID|DEV_ID|CERT_ID|USER_ACCESS_TOKEN)$/,
  );
  if (!envSpecificMatch) {
    return null;
  }

  const [, maybeEbayPrefix, rawEnvironment, rawField] = envSpecificMatch;
  const environment = getEnvironmentPrefix(rawEnvironment);
  if (!environment) {
    return null;
  }

  const field = getCredentialFieldFromKey(
    maybeEbayPrefix ? `EBAY_${rawField}` : rawField,
  );
  if (!field) {
    return null;
  }

  return { field, environment };
}

function mergeCredentialProfiles(
  current: EnvironmentCredentialProfiles,
  next: Partial<EnvironmentCredentialProfiles>,
) {
  return {
    production: {
      ...current.production,
      ...next.production,
    },
    sandbox: {
      ...current.sandbox,
      ...next.sandbox,
    },
  };
}

function applyCredentialProfile(
  config: EnvironmentConfig,
  credentialProfiles: EnvironmentCredentialProfiles,
  environment: EbayEnvironment,
) {
  return {
    ...config,
    environment,
    ...credentialProfiles[environment],
  };
}

function parseEnvFile(contents: string): ParsedEnvFile {
  const nextConfig: Partial<EnvironmentConfig> = {};
  const credentialProfiles = {
    production: { ...DEFAULT_CREDENTIAL_PROFILES.production },
    sandbox: { ...DEFAULT_CREDENTIAL_PROFILES.sandbox },
  };
  const genericCredentials: Partial<Pick<EnvironmentConfig, CredentialField>> = {};
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, rawKey, rawValue] = match;
    const value = stripWrappingQuotes(rawValue);
    const credentialMatch = getCredentialMatch(rawKey);

    if (credentialMatch && isCredentialField(credentialMatch.field)) {
      if (credentialMatch.environment) {
        credentialProfiles[credentialMatch.environment][credentialMatch.field] = value;
      } else {
        genericCredentials[credentialMatch.field] = value;
      }
      continue;
    }

    switch (rawKey.toUpperCase()) {
      case "EBAY_ENVIRONMENT":
      case "EBAY_ENV":
      case "ENVIRONMENT":
        nextConfig.environment = coerceEnvironment(value);
        break;
      case "REQUEST_LOCALE":
      case "ACCEPT_LANGUAGE":
        nextConfig.requestLocale = value;
        break;
      case "OAUTH_USER_SCOPES":
        nextConfig.oauthUserScopes = value;
        break;
      case "OAUTH_AUTHORIZE_URL_BASE":
        nextConfig.oauthAuthorizeUrlBase = value;
        break;
      default:
        break;
    }
  }

  return {
    config: nextConfig,
    credentialProfiles,
    genericCredentials,
  };
}

function parseItemIdFromUrl(value: string) {
  const match = value.match(/\/itm\/([^/?#]+)/i);
  return match?.[1]?.trim() ?? "";
}

function fieldInput(
  field: ApiFieldDefinition,
  value: string,
  onChange: (nextValue: string) => void,
) {
  if (field.type === "textarea") {
    return (
      <textarea
        id={field.key}
        className="input input--textarea"
        placeholder={field.placeholder}
        required={field.required}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      id={field.key}
      className="input"
      type={field.type === "number" ? "number" : "text"}
      inputMode={field.type === "number" ? "numeric" : "text"}
      placeholder={field.placeholder}
      required={field.required}
      spellCheck={false}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function EbayWorkbench() {
  const envFileInputId = useId();
  const envDragDepthRef = useRef(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [config, setConfig] = useState<EnvironmentConfig>(DEFAULT_ENVIRONMENT_CONFIG);
  const [credentialProfiles, setCredentialProfiles] = useState<EnvironmentCredentialProfiles>(
    DEFAULT_CREDENTIAL_PROFILES,
  );
  const [selectedApi, setSelectedApi] = useState<ApiFamilyId>("inventory");
  const [selectedCallId, setSelectedCallId] = useState<string>(
    findFamilyCall("inventory").id,
  );
  const [callValues, setCallValues] = useState<Record<string, string>>(
    getCallDefaults(findFamilyCall("inventory")),
  );
  const [responseState, setResponseState] = useState<ResponseState | null>(null);
  const [errorAlert, setErrorAlert] = useState<AlertState | null>(null);
  const [noticeAlert, setNoticeAlert] = useState<AlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingEnvFile, setIsDraggingEnvFile] = useState(false);
  const [inventoryItemUrl, setInventoryItemUrl] = useState("");
  const [skuParsingStatus, setSkuParsingStatus] = useState("");

  const availableCalls = API_CALLS.filter((call) => call.apiFamily === selectedApi);
  const selectedCall =
    availableCalls.find((call) => call.id === selectedCallId) ?? availableCalls[0];
  const selectedFamily =
    API_FAMILIES.find((family) => family.id === selectedApi) ?? API_FAMILIES[0];
  const environmentBadgeLabel =
    config.environment === "sandbox"
      ? selectedCall.sandboxSupported
        ? "Sandbox selected"
        : "Sandbox unsupported"
      : "Production selected";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<SessionState & EnvironmentConfig>;
        const savedEnvironment = parsed.config?.environment
          ? coerceEnvironment(parsed.config.environment)
          : parsed.environment
            ? coerceEnvironment(parsed.environment)
            : DEFAULT_ENVIRONMENT_CONFIG.environment;
        const baseConfig = parsed.config
          ? {
              ...DEFAULT_ENVIRONMENT_CONFIG,
              ...parsed.config,
              environment: savedEnvironment,
            }
          : {
              ...DEFAULT_ENVIRONMENT_CONFIG,
              ...parsed,
              environment: savedEnvironment,
            };
        const nextCredentialProfiles = mergeCredentialProfiles(
          DEFAULT_CREDENTIAL_PROFILES,
          parsed.credentialProfiles ?? {
            [savedEnvironment]: {
              appId: baseConfig.appId,
              devId: baseConfig.devId,
              certId: baseConfig.certId,
              userAccessToken: baseConfig.userAccessToken,
            },
          },
        );

        setCredentialProfiles(nextCredentialProfiles);
        setConfig(applyCredentialProfile(baseConfig, nextCredentialProfiles, savedEnvironment));
      } catch {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    const nextState: SessionState = {
      config,
      credentialProfiles,
    };

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextState));
  }, [config, credentialProfiles, isHydrated]);

  useEffect(() => {
    if (!availableCalls.some((call) => call.id === selectedCallId)) {
      const fallback = availableCalls[0];
      setSelectedCallId(fallback.id);
      setCallValues(getCallDefaults(fallback));
      setResponseState(null);
      setErrorAlert(null);
    }
  }, [availableCalls, selectedCallId]);

  useEffect(() => {
    setCallValues(getCallDefaults(selectedCall));
    setResponseState(null);
    setErrorAlert(null);
    setInventoryItemUrl("");
    setSkuParsingStatus("");
  }, [selectedCall]);

  function updateConfig<K extends keyof EnvironmentConfig>(
    key: K,
    value: EnvironmentConfig[K],
  ) {
    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateCredentialField(
    key: CredentialField,
    value: EnvironmentConfig[CredentialField],
  ) {
    setCredentialProfiles((current) => ({
      ...current,
      [config.environment]: {
        ...current[config.environment],
        [key]: value,
      },
    }));

    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleEnvironmentChange(nextEnvironment: EbayEnvironment) {
    setConfig((current) => applyCredentialProfile(current, credentialProfiles, nextEnvironment));
  }

  function updateCallValue(key: string, value: string) {
    setCallValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleInventoryUrlChange(nextValue: string) {
    setInventoryItemUrl(nextValue);

    const parsedSku = parseItemIdFromUrl(nextValue);
    updateCallValue("sku", parsedSku);

    const nextStatus = parsedSku ? `Parsing ${parsedSku}...` : "";
    setSkuParsingStatus(nextStatus);
  }

  async function loadEnvFile(file: File) {
    if (!file) {
      return;
    }

    const contents = await file.text();
    const parsed = parseEnvFile(contents);
    const nextEnvironment = parsed.config.environment ?? config.environment;
    const parsedProfilesWithGeneric = mergeCredentialProfiles(parsed.credentialProfiles, {
      [nextEnvironment]: parsed.genericCredentials,
    });

    setCredentialProfiles((current) => {
      const nextProfiles = mergeCredentialProfiles(current, parsedProfilesWithGeneric);

      setConfig((currentConfig) =>
        applyCredentialProfile(
          {
            ...currentConfig,
            ...parsed.config,
            environment: nextEnvironment,
          },
          nextProfiles,
          nextEnvironment,
        ),
      );

      return nextProfiles;
    });
    setNoticeAlert({
      title: `Loaded credentials from ${file.name} into this browser session.`,
      detail:
        "The form now keeps separate APP_ID, Dev_ID, Cert_ID, and PRODUCTION_USER_ACCESS_TOKEN or SANDBOX_USER_ACCESS_TOKEN values and swaps them automatically when you change environments.",
    });
    setErrorAlert(null);
  }

  async function handleEnvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await loadEnvFile(file);
    event.target.value = "";
  }

  function handleEnvDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    envDragDepthRef.current += 1;
    setIsDraggingEnvFile(true);
  }

  function handleEnvDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingEnvFile(true);
  }

  function handleEnvDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    envDragDepthRef.current = Math.max(0, envDragDepthRef.current - 1);
    if (envDragDepthRef.current === 0) {
      setIsDraggingEnvFile(false);
    }
  }

  async function handleEnvDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    envDragDepthRef.current = 0;
    setIsDraggingEnvFile(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    await loadEnvFile(file);
  }

  function resetApiSection() {
    setCallValues(getCallDefaults(selectedCall));
    setResponseState(null);
    setErrorAlert(null);
    setInventoryItemUrl("");
    setSkuParsingStatus("");
  }

  async function copyResponse() {
    if (!responseState?.body) {
      return;
    }

    await navigator.clipboard.writeText(responseState.body);
    setNoticeAlert({
      title: "Copied the current JSON response to the clipboard.",
    });
  }

  async function copyFinderCommand() {
    await navigator.clipboard.writeText(FINDER_ENV_COMMAND);
    setNoticeAlert({
      title: "Copied the Finder command to the clipboard.",
      detail:
        "Run it in Terminal to show hidden files in Finder, including .env files in this workspace.",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorAlert(null);
    setNoticeAlert(null);

    try {
      const response = await fetch("/api/ebay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callId: selectedCall.id,
          config,
          params: callValues,
        }),
      });

      const payload = (await response.json()) as
        | { error: string; requestUrl?: string }
        | {
            ok: boolean;
            status: number;
            statusText: string;
            requestUrl: string;
            data: unknown;
          };

      if ("error" in payload) {
        const detailParts = [
          payload.requestUrl ? `Request URL: ${payload.requestUrl}` : undefined,
          JSON.stringify(payload, null, 2),
        ].filter(Boolean);

        setResponseState({
          ok: false,
          status: response.status,
          statusText: response.statusText,
          requestUrl: payload.requestUrl,
          body: JSON.stringify(payload, null, 2),
        });
        setErrorAlert({
          title: payload.error,
          detail: detailParts.join("\n\n"),
        });
        return;
      }

      setResponseState({
        ok: payload.ok,
        status: payload.status,
        statusText: payload.statusText,
        requestUrl: payload.requestUrl,
        body: JSON.stringify(payload, null, 2),
      });

      if (
        selectedCall.id === "inventory-get-items" &&
        response.ok &&
        typeof payload.data === "object" &&
        payload.data !== null &&
        "total" in payload.data &&
        payload.data.total === 0
      ) {
        setNoticeAlert({
          title:
            "eBay returned zero Inventory API records for this seller account.",
          detail:
            "Active listings created outside the Inventory API model will not appear here until they are migrated with bulkMigrateListing.\n\nListings with Out-of-Stock control can remain active once they are Inventory API-managed.\n\nResponse:\n" +
            JSON.stringify(payload.data, null, 2),
        });
      }

      if (!response.ok) {
        setErrorAlert({
          title: `The eBay API returned ${payload.status} ${payload.statusText}.`,
          detail:
            `Request URL: ${payload.requestUrl}\n\n` +
            JSON.stringify(payload.data, null, 2),
        });
      }
    } catch (error) {
      setResponseState(null);
      setErrorAlert({
        title: "Unable to submit the eBay request from the browser.",
        detail:
          error instanceof Error
            ? error.message
            : "An unknown browser or network error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero panel" id="top">
        <div className="hero__copy">
          <p className="eyebrow">eBay API Workbench</p>
          <h1>Run seller-facing eBay APIs from one polished control center.</h1>
          <p className="hero__lede">
            Switch between Sandbox and Production, load credentials once per session, and
            inspect every selected Account, Inventory, Taxonomy, or Fulfillment response as
            formatted JSON.
          </p>
          <div className="hero__highlights">
            <div className="hero-stat">
              <strong>4</strong>
              <span>API families wired into one interface</span>
            </div>
            <div className="hero-stat">
              <strong>Session-safe</strong>
              <span>Environment values persist while call-specific fields reset cleanly</span>
            </div>
          </div>
        </div>
        <div className="hero__panel">
          <div className="hero__panel-top">
            <span>Docs-driven</span>
            <p>Official eBay references shape the call list, descriptions, and required inputs.</p>
          </div>

          <div className="hero__api-list">
            <div className="hero__api-item">
              <strong>Account</strong>
              <span>Policies and seller privileges</span>
            </div>
            <div className="hero__api-item">
              <strong>Inventory</strong>
              <span>SKUs, locations, and offers</span>
            </div>
            <div className="hero__api-item">
              <strong>Taxonomy</strong>
              <span>Category trees and item aspects</span>
            </div>
            <div className="hero__api-item">
              <strong>Fulfillment</strong>
              <span>Orders and shipping status</span>
            </div>
          </div>

          <div className="hero__panel-footer">
            <span>Built for rapid inspection</span>
            <strong>Readable responses, copy-ready payloads, minimal form friction.</strong>
          </div>
        </div>
      </section>

      <section className="workspace">
        <form className="stack" onSubmit={handleSubmit}>
          <div className="panel" id="configuration">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Session Configuration</p>
                <h2>Environment and credentials</h2>
              </div>
              <label
                htmlFor={envFileInputId}
                className={`upload-pill upload-pill--dropzone ${
                  isDraggingEnvFile ? "upload-pill--active" : ""
                }`}
                onDragEnter={handleEnvDragEnter}
                onDragOver={handleEnvDragOver}
                onDragLeave={handleEnvDragLeave}
                onDrop={handleEnvDrop}
              >
                <span>Drop `.env` here or click to upload</span>
                <small>Supports drag and drop for local environment files.</small>
              </label>
              <input
                id={envFileInputId}
                className="upload-pill__input"
                type="file"
                accept=".env,text/plain"
                onChange={handleEnvUpload}
              />
            </div>

            <div className="utility-card">
              <div className="utility-card__header">
                <div>
                  <p className="eyebrow">Finder Tip</p>
                  <h3>Show `.env` files in Finder</h3>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={copyFinderCommand}
                  aria-label="Copy Finder command"
                  title="Copy Finder command"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M9 9h9v11H9zM6 4h9v3H8v9H6z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <p>
                Use this Terminal command to make hidden files visible in Finder so you can locate
                your local <code>.env</code> file quickly.
              </p>
              <pre className="command-block">{FINDER_ENV_COMMAND}</pre>
            </div>

            <div className="grid grid--credentials">
              <label className="field">
                <span>Environment</span>
                <select
                  className="input"
                  value={config.environment}
                  onChange={(event) =>
                    handleEnvironmentChange(coerceEnvironment(event.target.value))
                  }
                >
                  <option value="production">Production</option>
                  <option value="sandbox">Sandbox</option>
                </select>
              </label>

              <label className="field">
                <span>APP_ID</span>
                <input
                  className="input"
                  value={config.appId}
                  placeholder="Your eBay App ID"
                  onChange={(event) => updateCredentialField("appId", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Dev_ID</span>
                <input
                  className="input"
                  value={config.devId}
                  placeholder="Your eBay Dev ID"
                  onChange={(event) => updateCredentialField("devId", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Cert_ID</span>
                <input
                  className="input"
                  value={config.certId}
                  placeholder="Your eBay Cert ID"
                  onChange={(event) => updateCredentialField("certId", event.target.value)}
                />
              </label>

              <label className="field field--wide">
                <span>PRODUCTION_USER_ACCESS_TOKEN</span>
                <textarea
                  className="input input--textarea"
                  value={config.userAccessToken}
                  placeholder="Paste the bearer token used for the selected environment"
                  spellCheck={false}
                  onChange={(event) =>
                    updateCredentialField("userAccessToken", event.target.value)
                  }
                />
              </label>

              <label className="field">
                <span>REQUEST_LOCALE</span>
                <input
                  className="input"
                  value={config.requestLocale}
                  placeholder="en-US"
                  spellCheck={false}
                  onChange={(event) => updateConfig("requestLocale", event.target.value)}
                />
              </label>

              <label className="field field--wide">
                <span>OAUTH_USER_SCOPES</span>
                <textarea
                  className="input input--textarea"
                  value={config.oauthUserScopes}
                  placeholder="Space-separated or comma-separated scopes"
                  spellCheck={false}
                  onChange={(event) => updateConfig("oauthUserScopes", event.target.value)}
                />
              </label>

              <label className="field field--wide">
                <span>OAUTH_AUTHORIZE_URL_BASE</span>
                <input
                  className="input"
                  value={config.oauthAuthorizeUrlBase}
                  placeholder="https://auth.ebay.com/oauth2/authorize"
                  spellCheck={false}
                  onChange={(event) =>
                    updateConfig("oauthAuthorizeUrlBase", event.target.value)
                  }
                />
              </label>
            </div>

              <p className="microcopy">
                APP_ID, Dev_ID, Cert_ID, and the environment-specific user access token are
                preserved for the browser session so the user can swap calls without re-entering
                them. Production and Sandbox credential sets are stored separately, and changing
                the environment dropdown loads the matching values automatically. The live REST
                requests in this workbench use the provided OAuth bearer token and a valid locale
                header such as
                <code>en-US</code>.
              </p>
          </div>

          <div className="panel" id="api-runner">
            <div className="section-heading">
              <div>
                <p className="eyebrow">API Runner</p>
                <h2>Select the API family and call</h2>
              </div>
            </div>

            <div className="runner-shell">
              <p className="runner-lede">
                Start with the API family, then pick the exact eBay method you want to inspect.
                The details and required inputs update automatically.
              </p>

              <div className="segmented" role="tablist" aria-label="API families">
                {API_FAMILIES.map((family) => (
                  <button
                    key={family.id}
                    type="button"
                    className={`segmented__item ${
                      family.id === selectedApi ? "segmented__item--active" : ""
                    }`}
                    onClick={() => setSelectedApi(family.id)}
                  >
                    <span>{family.label}</span>
                    <small>{family.description}</small>
                  </button>
                ))}
              </div>

              <div className="runner-grid">
                <div className="selector-card">
                  <div className="selector-card__header">
                    <p className="eyebrow">Step 1</p>
                    <h3>Choose a call</h3>
                    <p>
                      {selectedFamily.label} currently exposes {availableCalls.length} configured
                      call{availableCalls.length === 1 ? "" : "s"} in this workbench.
                    </p>
                  </div>

                  <div className="family-badge">
                    <strong>{selectedFamily.label}</strong>
                    <span>{selectedFamily.description}</span>
                  </div>

                  <label className="field field--compact">
                    <span>API Call</span>
                    <select
                      className="input input--selector"
                      value={selectedCall.id}
                      onChange={(event) => setSelectedCallId(event.target.value)}
                    >
                      {availableCalls.map((call) => (
                        <option key={call.id} value={call.id}>
                          {call.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="description-card description-card--featured">
                  <div className="description-card__top">
                    <div>
                      <p className="eyebrow">Step 2</p>
                      <h3>{selectedCall.title}</h3>
                    </div>
                    <span
                      className={`support-pill ${
                        config.environment === "sandbox" && !selectedCall.sandboxSupported
                          ? "support-pill--restricted"
                          : selectedCall.sandboxSupported
                          ? "support-pill--supported"
                          : "support-pill--restricted"
                      }`}
                    >
                      {environmentBadgeLabel}
                    </span>
                  </div>

                  <p className="description-card__summary">{selectedCall.summary}</p>

                  <div className="description-meta">
                    <div className="description-meta__item">
                      <span>Method</span>
                      <strong>{selectedCall.method}</strong>
                    </div>
                    <div className="description-meta__item">
                      <span>Scopes</span>
                      <strong>{selectedCall.requiredScopes.length}</strong>
                    </div>
                    <div className="description-meta__item description-meta__item--wide">
                      <span>Required scopes</span>
                      <strong>{selectedCall.requiredScopes.join(", ")}</strong>
                    </div>
                  </div>

                  {selectedCall.notes?.map((note) => (
                    <p key={note} className="note">
                      {note}
                    </p>
                  ))}

                  <a
                    className="docs-link"
                    href={selectedCall.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open eBay documentation
                  </a>
                </div>
              </div>

              <div className="params-card">
                <div className="params-card__header">
                  <div>
                    <p className="eyebrow">Step 3</p>
                    <h3>Provide required inputs</h3>
                  </div>
                  <p>
                    Only the fields required by the selected call are shown here. Reset clears this
                    section without touching your session credentials.
                  </p>
                </div>

                <div className="grid grid--params">
                  {selectedCall.fields.length === 0 ? (
                    <div className="empty-state">
                      <strong>No call-specific inputs are required.</strong>
                      <p>You can run this method immediately with the session credentials above.</p>
                    </div>
                  ) : (
                    selectedCall.fields.map((field) => (
                      <label
                        key={field.key}
                        className={`field ${
                          ["inventory-get-item", "inventory-get-offers"].includes(selectedCall.id) &&
                          field.key === "sku"
                            ? "field--wide"
                            : ""
                        }`}
                      >
                        {["inventory-get-item", "inventory-get-offers"].includes(selectedCall.id) &&
                        field.key === "sku" ? (
                          <>
                            <span>
                              Item URL
                              {field.required ? " *" : ""}
                            </span>
                            <input
                              className="input"
                              type="text"
                              inputMode="url"
                              placeholder="https://www.ebay.com/itm/318101253980"
                              spellCheck={false}
                              value={inventoryItemUrl}
                              onChange={(event) => handleInventoryUrlChange(event.target.value)}
                            />
                            {skuParsingStatus ? (
                              <small className="field-status">{skuParsingStatus}</small>
                            ) : null}
                            <small>
                              Copy the eBay item URL and paste it here. This workbench will parse
                              the value after <code>/itm/</code> and use it as the SKU for this
                              call.
                            </small>
                          </>
                        ) : (
                          <>
                            <span>
                              {field.label}
                              {field.required ? " *" : ""}
                            </span>
                            {fieldInput(field, callValues[field.key] ?? "", (nextValue) =>
                              updateCallValue(field.key, nextValue),
                            )}
                            <small>{field.description}</small>
                          </>
                        )}
                      </label>
                    ))
                  )}
                </div>

                {selectedCall.id === "inventory-get-items" ? (
                  <div className="insight-card">
                    <p className="eyebrow">Why Listings May Be Missing</p>
                    <h4>`getInventoryItems` only returns Inventory API records.</h4>
                    <p>
                      Active listings created outside the Inventory API model will not appear here
                      until they are migrated.
                    </p>
                    <p>
                      Migration requires an eligible fixed-price listing with a seller SKU. After
                      migration, use <strong>`getOffers`</strong> to inspect listing statuses such
                      as <strong>`ACTIVE`</strong> and <strong>`OUT_OF_STOCK`</strong>.
                    </p>
                  </div>
                ) : null}

                {selectedCall.id === "browse-get-item-by-legacy-id" ? (
                  <div className="insight-card insight-card--browse">
                    <p className="eyebrow">Legacy Listing Lookup</p>
                    <h4>Use the public item ID when Inventory API migration is not possible.</h4>
                    <p>
                      The value after <code>/itm/</code> in an eBay listing URL can be looked up
                      directly through the Browse API.
                    </p>
                    <p>
                      This is the right fallback for listings that cannot be migrated because they
                      do not have seller-defined SKUs.
                    </p>
                  </div>
                ) : null}

                <div className="actions">
                  <button className="button button--primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Calling eBay..." : "Run API Call"}
                  </button>
                  <button className="button button--ghost" type="button" onClick={resetApiSection}>
                    Reset Selected API Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        <aside className="stack">
          <div className="panel response-panel" id="response-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Response</p>
                <h2>Beautified JSON output</h2>
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={copyResponse}
                disabled={!responseState}
              >
                Copy Response
              </button>
            </div>

            {responseState ? (
              <>
                <div className="response-meta">
                  <span
                    className={`status-pill ${
                      responseState.ok ? "status-pill--ok" : "status-pill--error"
                    }`}
                  >
                    {responseState.status} {responseState.statusText}
                  </span>
                  {responseState.requestUrl ? <code>{responseState.requestUrl}</code> : null}
                </div>
                <pre className="json-view">{responseState.body}</pre>
              </>
            ) : (
              <div className="empty-state">
                <strong>No response yet.</strong>
                <p>Run a call to view the JSON payload here.</p>
              </div>
            )}
          </div>

          {(errorAlert || noticeAlert) && (
            <div className="panel alert-panel" aria-live="polite">
              {errorAlert && (
                <div className="alert alert--error">
                  <strong>{errorAlert.title}</strong>
                  {errorAlert.detail ? <pre>{errorAlert.detail}</pre> : null}
                </div>
              )}
              {noticeAlert && (
                <div className="alert alert--notice">
                  <strong>{noticeAlert.title}</strong>
                  {noticeAlert.detail ? <pre>{noticeAlert.detail}</pre> : null}
                </div>
              )}
            </div>
          )}
        </aside>
      </section>

      <footer className="app-footer" aria-label="Site footer">
        <div className="app-footer__main">
          <div className="app-footer__brand">
            <p className="eyebrow">eBay API Workbench</p>
            <h2>Seller API tooling in one place.</h2>
            <p>
              A focused control center for inspecting eBay Account, Inventory, Taxonomy, and
              Fulfillment API responses with less setup friction.
            </p>
          </div>

          <nav className="app-footer__nav" aria-label="Footer navigation">
            <div>
              <span className="app-footer__label">Explore</span>
              <a href="#configuration">Configuration</a>
              <a href="#api-runner">API Runner</a>
              <a href="#response-panel">Response</a>
            </div>
            <div>
              <span className="app-footer__label">Resources</span>
              <a href="https://developer.ebay.com/api-docs" target="_blank" rel="noreferrer">
                eBay API Docs
              </a>
              <a href="#top">Back to top</a>
            </div>
          </nav>
        </div>

        <div className="app-footer__meta">
          <p>Built with Next.js 16, React 19, TypeScript, Vercel, and eBay REST APIs.</p>
          <p>&copy; {new Date().getFullYear()} eBay API Workbench</p>
        </div>
      </footer>
    </main>
  );
}
