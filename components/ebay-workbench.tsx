"use client";

import {
  useEffect,
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
  type EnvironmentConfig,
} from "@/lib/ebay-apis";

const SESSION_STORAGE_KEY = "ebay-inventory-workbench:env";

type ResponseState = {
  ok: boolean;
  status: number;
  statusText: string;
  requestUrl: string;
  body: string;
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

function parseEnvFile(contents: string) {
  const nextConfig: Partial<EnvironmentConfig> = {};
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

    switch (rawKey.toUpperCase()) {
      case "EBAY_ENVIRONMENT":
      case "EBAY_ENV":
      case "ENVIRONMENT":
        nextConfig.environment = coerceEnvironment(value);
        break;
      case "APP_ID":
      case "EBAY_APP_ID":
        nextConfig.appId = value;
        break;
      case "DEV_ID":
      case "EBAY_DEV_ID":
        nextConfig.devId = value;
        break;
      case "CERT_ID":
      case "EBAY_CERT_ID":
        nextConfig.certId = value;
        break;
      case "USER_ACCESS_TOKEN":
      case "EBAY_USER_ACCESS_TOKEN":
        nextConfig.userAccessToken = value;
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

  return nextConfig;
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [config, setConfig] = useState<EnvironmentConfig>(DEFAULT_ENVIRONMENT_CONFIG);
  const [selectedApi, setSelectedApi] = useState<ApiFamilyId>("inventory");
  const [selectedCallId, setSelectedCallId] = useState<string>(
    findFamilyCall("inventory").id,
  );
  const [callValues, setCallValues] = useState<Record<string, string>>(
    getCallDefaults(findFamilyCall("inventory")),
  );
  const [responseState, setResponseState] = useState<ResponseState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingEnvFile, setIsDraggingEnvFile] = useState(false);

  const availableCalls = API_CALLS.filter((call) => call.apiFamily === selectedApi);
  const selectedCall =
    availableCalls.find((call) => call.id === selectedCallId) ?? availableCalls[0];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<EnvironmentConfig>;
        setConfig((current) => ({
          ...current,
          ...parsed,
          environment: parsed.environment
            ? coerceEnvironment(parsed.environment)
            : current.environment,
        }));
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

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(config));
  }, [config, isHydrated]);

  useEffect(() => {
    if (!availableCalls.some((call) => call.id === selectedCallId)) {
      const fallback = availableCalls[0];
      setSelectedCallId(fallback.id);
      setCallValues(getCallDefaults(fallback));
      setResponseState(null);
      setErrorMessage(null);
    }
  }, [availableCalls, selectedCallId]);

  useEffect(() => {
    setCallValues(getCallDefaults(selectedCall));
    setResponseState(null);
    setErrorMessage(null);
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

  function updateCallValue(key: string, value: string) {
    setCallValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function loadEnvFile(file: File) {
    if (!file) {
      return;
    }

    const contents = await file.text();
    const parsed = parseEnvFile(contents);

    setConfig((current) => ({
      ...current,
      ...parsed,
      environment: parsed.environment ?? current.environment,
    }));
    setNotice(`Loaded credentials from ${file.name} into this browser session.`);
    setErrorMessage(null);
  }

  async function handleEnvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await loadEnvFile(file);
    event.target.value = "";
  }

  function handleEnvDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingEnvFile(true);
  }

  function handleEnvDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingEnvFile(false);
  }

  async function handleEnvDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
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
    setErrorMessage(null);
  }

  async function copyResponse() {
    if (!responseState?.body) {
      return;
    }

    await navigator.clipboard.writeText(responseState.body);
    setNotice("Copied the current JSON response to the clipboard.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setNotice(null);

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
        | { error: string }
        | {
            ok: boolean;
            status: number;
            statusText: string;
            requestUrl: string;
            data: unknown;
          };

      if (!response.ok || "error" in payload) {
        setResponseState(null);
        setErrorMessage("error" in payload ? payload.error : "The eBay request failed.");
        return;
      }

      setResponseState({
        ok: payload.ok,
        status: payload.status,
        statusText: payload.statusText,
        requestUrl: payload.requestUrl,
        body: JSON.stringify(payload.data, null, 2),
      });
    } catch (error) {
      setResponseState(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the eBay request from the browser.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero panel">
        <div className="hero__copy">
          <p className="eyebrow">eBay Inventory Workbench</p>
          <h1>Inspect store inventory, policies, taxonomy, and order flow from one console.</h1>
          <p className="hero__lede">
            This app keeps your environment credentials in session storage, lets you swap
            between Sandbox and Production, and renders every selected eBay response as
            readable JSON.
          </p>
        </div>
        <div className="hero__badge">
          <span>Docs-driven</span>
          <strong>Account · Inventory · Taxonomy · Fulfillment</strong>
        </div>
      </section>

      <section className="workspace">
        <form className="stack" onSubmit={handleSubmit}>
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Session Configuration</p>
                <h2>Environment and credentials</h2>
              </div>
              <label
                className={`upload-pill upload-pill--dropzone ${
                  isDraggingEnvFile ? "upload-pill--active" : ""
                }`}
                onDragOver={handleEnvDragOver}
                onDragLeave={handleEnvDragLeave}
                onDrop={handleEnvDrop}
              >
                <span>Drop `.env` here or click to upload</span>
                <small>Supports drag and drop for local environment files.</small>
                <input type="file" accept=".env,text/plain" onChange={handleEnvUpload} />
              </label>
            </div>

            <div className="grid grid--credentials">
              <label className="field">
                <span>Environment</span>
                <select
                  className="input"
                  value={config.environment}
                  onChange={(event) =>
                    updateConfig("environment", coerceEnvironment(event.target.value))
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
                  onChange={(event) => updateConfig("appId", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Dev_ID</span>
                <input
                  className="input"
                  value={config.devId}
                  placeholder="Your eBay Dev ID"
                  onChange={(event) => updateConfig("devId", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Cert_ID</span>
                <input
                  className="input"
                  value={config.certId}
                  placeholder="Your eBay Cert ID"
                  onChange={(event) => updateConfig("certId", event.target.value)}
                />
              </label>

              <label className="field field--wide">
                <span>USER_ACCESS_TOKEN</span>
                <textarea
                  className="input input--textarea"
                  value={config.userAccessToken}
                  placeholder="Paste the bearer token used for the selected environment"
                  spellCheck={false}
                  onChange={(event) => updateConfig("userAccessToken", event.target.value)}
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
              APP_ID, Dev_ID, and Cert_ID are preserved for the browser session so the user can
              swap calls without re-entering them. The live REST requests in this workbench use
              the provided OAuth bearer token.
            </p>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">API Runner</p>
                <h2>Select the API family and call</h2>
              </div>
            </div>

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

            <div className="grid grid--api">
              <label className="field">
                <span>API Call</span>
                <select
                  className="input"
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

              <div className="description-card">
                <p className="eyebrow">Call Description</p>
                <h3>{selectedCall.title}</h3>
                <p>{selectedCall.summary}</p>
                <p>
                  <strong>Method:</strong> {selectedCall.method}
                </p>
                <p>
                  <strong>Sandbox:</strong>{" "}
                  {selectedCall.sandboxSupported ? "Supported" : "Not supported"}
                </p>
                <p>
                  <strong>Required scopes:</strong>{" "}
                  {selectedCall.requiredScopes.join(", ")}
                </p>
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

            <div className="grid grid--params">
              {selectedCall.fields.length === 0 ? (
                <div className="empty-state">
                  <strong>No call-specific inputs are required.</strong>
                  <p>You can run this method immediately with the session credentials above.</p>
                </div>
              ) : (
                selectedCall.fields.map((field) => (
                  <label key={field.key} className="field">
                    <span>
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    {fieldInput(field, callValues[field.key] ?? "", (nextValue) =>
                      updateCallValue(field.key, nextValue),
                    )}
                    <small>{field.description}</small>
                  </label>
                ))
              )}
            </div>

            <div className="actions">
              <button className="button button--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Calling eBay..." : "Run API Call"}
              </button>
              <button className="button button--ghost" type="button" onClick={resetApiSection}>
                Reset Selected API Form
              </button>
            </div>
          </div>
        </form>

        <aside className="stack">
          <div className="panel response-panel">
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
                  <code>{responseState.requestUrl}</code>
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

          {(errorMessage || notice) && (
            <div className="panel alert-panel" aria-live="polite">
              {errorMessage && <p className="alert alert--error">{errorMessage}</p>}
              {notice && <p className="alert alert--notice">{notice}</p>}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
