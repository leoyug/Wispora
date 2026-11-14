import { endpointPermissionPattern, getAiSettings, saveAiSettings } from "./config";
import type { AiSettings } from "./types";

let pendingChange: Promise<unknown> = Promise.resolve();
const activeRequests = new Map<string, number>();

function changePermissions<T>(operation: () => Promise<T>) {
  const result = pendingChange.then(operation);
  pendingChange = result.catch(() => undefined);
  return result;
}

function savedOrigin(settings: AiSettings) {
  if (!settings.enabled) return undefined;
  try { return endpointPermissionPattern(settings.endpoint); }
  catch { return undefined; }
}

async function releaseUnusedOrigin(origin: string, retainedOrigin?: string) {
  if (origin !== retainedOrigin && !activeRequests.has(origin)) {
    await browser.permissions.remove({ origins: [origin] }).catch(() => false);
  }
}

export function saveAiSettingsWithPermission(input: AiSettings & { apiKey?: string }) {
  return changePermissions(async () => {
    const origin = endpointPermissionPattern(input.endpoint);
    const previousOrigin = savedOrigin(await getAiSettings());
    try {
      if (input.enabled && !(await browser.permissions.contains({ origins: [origin] }))) {
        throw new Error("需要允许访问当前 Provider 域名，才能发送 AI 请求。");
      }
      const settings = await saveAiSettings(input);
      if (previousOrigin) await releaseUnusedOrigin(previousOrigin, savedOrigin(settings));
      if (!settings.enabled) await releaseUnusedOrigin(origin);
      return settings;
    } catch (error) {
      await releaseUnusedOrigin(origin, previousOrigin);
      throw error;
    }
  });
}

export async function withTemporaryAiPermission<T>(origin: string, request: () => Promise<T>): Promise<T> {
  activeRequests.set(origin, (activeRequests.get(origin) ?? 0) + 1);
  try {
    return await request();
  } finally {
    await changePermissions(async () => {
      const remaining = (activeRequests.get(origin) ?? 1) - 1;
      if (remaining) {
        activeRequests.set(origin, remaining);
        return;
      }
      activeRequests.delete(origin);
      await releaseUnusedOrigin(origin, savedOrigin(await getAiSettings()));
    });
  }
}
