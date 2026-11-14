import type { AiSettings, AiSettingsView, ApiKeyStorage } from "./types";
import { inferProvider, isAiProviderId } from "./presets";

const SETTINGS_KEY = "wanderland.ai.settings";
const LOCAL_KEY = "wanderland.ai.apiKey";
const SESSION_KEY = "wanderland.ai.sessionApiKey";

type ScopedKey = Pick<AiSettings, "provider" | "endpoint"> & { apiKey: string };
type StoredSettings = Partial<AiSettings> & { scopedKey?: true };
let pendingSave: Promise<unknown> = Promise.resolve();

export const defaultAiSettings: AiSettings = {
  enabled: false,
  provider: "openai",
  endpoint: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  apiKeyStorage: "session",
};

export function canReuseAiKey(saved: Pick<AiSettings, "provider" | "endpoint">, draft: Pick<AiSettings, "provider" | "endpoint">) {
  if (saved.provider !== draft.provider) return false;
  try {
    return assertSecureAiEndpoint(saved.endpoint).origin === assertSecureAiEndpoint(draft.endpoint).origin;
  } catch {
    return false;
  }
}

function cleanSettings(value: Partial<AiSettings> | undefined): AiSettings {
  const endpoint = value?.endpoint?.trim().replace(/\/$/, "") || defaultAiSettings.endpoint;
  const model = value?.model?.trim() || defaultAiSettings.model;
  const apiKeyStorage: ApiKeyStorage = value?.apiKeyStorage === "local" ? "local" : "session";
  const provider = isAiProviderId(value?.provider)
    ? value.provider
    : inferProvider(endpoint);
  return { enabled: value?.enabled === true, provider, endpoint, model, apiKeyStorage };
}

export async function getAiSettings(): Promise<AiSettingsView> {
  const { settings, apiKey } = await getStoredCredential();
  return { ...settings, hasApiKey: Boolean(apiKey) };
}

async function getStoredCredential() {
  const stored = await browser.storage.local.get([SETTINGS_KEY, LOCAL_KEY]);
  const saved = stored[SETTINGS_KEY] as StoredSettings | undefined;
  const settings = cleanSettings(saved);
  const value = settings.apiKeyStorage === "local"
    ? stored[LOCAL_KEY]
    : (await browser.storage.session.get(SESSION_KEY))[SESSION_KEY];
  // Legacy keys are only valid alongside legacy settings. All new writes bind the key to its endpoint.
  if (typeof value === "string" && saved && !saved.scopedKey && canReuseAiKey(settings, settings)) {
    return { settings, apiKey: value };
  }
  const credential = value as ScopedKey | undefined;
  const apiKey = typeof credential?.apiKey === "string" && canReuseAiKey(credential, settings) ? credential.apiKey : "";
  return { settings, apiKey };
}

export async function getAiCredentials(): Promise<{ settings: AiSettings; apiKey: string } | null> {
  const credential = await getStoredCredential();
  return credential.settings.enabled && credential.apiKey ? credential : null;
}

export async function getAiConnectionCredentials(input: AiSettings & { apiKey?: string }): Promise<{ settings: AiSettings; apiKey: string }> {
  assertSecureAiEndpoint(input.endpoint);
  const settings = cleanSettings(input);
  const previous = await getStoredCredential();
  const apiKey = input.apiKey?.trim() || (canReuseAiKey(previous.settings, settings) ? previous.apiKey : "");
  if (!apiKey) throw new Error("请先填写 API Key。");
  return { settings, apiKey };
}

export async function getAiTestCredentials(input: AiSettings & { apiKey?: string }) {
  if (!input.model.trim()) throw new Error("请填写模型 ID。");
  return getAiConnectionCredentials(input);
}

export function saveAiSettings(input: AiSettings & { apiKey?: string }): Promise<AiSettingsView> {
  const result = pendingSave.then(() => writeAiSettings(input));
  pendingSave = result.catch(() => undefined);
  return result;
}

async function writeAiSettings(input: AiSettings & { apiKey?: string }): Promise<AiSettingsView> {
  assertSecureAiEndpoint(input.endpoint);
  if (!input.model.trim()) throw new Error("请填写模型 ID。");
  const previous = await getStoredCredential();
  const settings = cleanSettings(input);
  const apiKey = input.apiKey?.trim() || (canReuseAiKey(previous.settings, settings) ? previous.apiKey : "");
  if (settings.enabled && !apiKey) throw new Error("请填写 API Key。");
  const saved = { ...settings, scopedKey: true } satisfies StoredSettings;
  const credential: ScopedKey | null = apiKey ? { provider: settings.provider, endpoint: settings.endpoint, apiKey } : null;
  if (settings.apiKeyStorage === "local") {
    await browser.storage.local.set({ [SETTINGS_KEY]: saved, [LOCAL_KEY]: credential });
    await browser.storage.session.remove(SESSION_KEY);
  } else {
    await browser.storage.session.set({ [SESSION_KEY]: credential });
    await browser.storage.local.set({ [SETTINGS_KEY]: saved, [LOCAL_KEY]: null });
  }
  return { ...settings, hasApiKey: Boolean(apiKey) };
}

export async function hardenAiCredentialStorage() {
  await Promise.all([
    browser.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
    browser.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
  ]);
}

export function assertSecureAiEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  if (url.protocol !== "https:") throw new Error("Endpoint 必须使用 https://");
  if (url.username || url.password) throw new Error("Endpoint 不能包含用户名、密码或 API Key");
  return url;
}

export function endpointPermissionPattern(endpoint: string) {
  const url = assertSecureAiEndpoint(endpoint);
  return `${url.protocol}//${url.hostname}/*`;
}
