import { endpointPermissionPattern, getAiSettings, saveAiSettings } from "./config";
import type { AiSettings } from "./types";

const lockName = "wispora.host-permissions";
export const hostPermissionPort = "host-permission-operation";
let pendingCleanup: Promise<void> | undefined;

export async function withHostPermissionUse<T>(operation: () => Promise<T>): Promise<T> {
  return await navigator.locks.request(lockName, { mode: "shared" }, operation);
}

export function releaseUnusedHostPermissions() {
  return navigator.locks.request(lockName, { ifAvailable: true }, async (lock) => {
    if (!lock) return false;
    const settings = await getAiSettings();
    const retained = settings.enabled
      ? (() => {
          try { return endpointPermissionPattern(settings.endpoint); }
          catch { return undefined; }
        })()
      : undefined;
    const manifest = browser.runtime.getManifest();
    const required = new Set([...(manifest.host_permissions ?? []), ...(manifest.permissions ?? [])]);
    const { origins = [] } = await browser.permissions.getAll();
    const unused = origins.filter((origin) => /^https?:\/\/[^/*]+\/\*$/.test(origin)
      && origin !== retained && !required.has(origin));
    if (unused.length) await browser.permissions.remove({ origins: unused });
    return true;
  });
}

export function drainUnusedHostPermissions() {
  pendingCleanup ??= (async () => {
    while (!(await releaseUnusedHostPermissions())) {
      // Queuing an exclusive lock would block a dashboard's nested background operation.
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      // Use an extension API while we wait so MV3 does not suspend the worker mid-cleanup.
      await browser.permissions.getAll();
    }
  })().finally(() => { pendingCleanup = undefined; });
  return pendingCleanup;
}

/** Hold the permission from before the browser prompt until the operation completes. */
export async function withRequestedHostPermissions<T>(origins: string[], operation: (granted: boolean) => Promise<T>) {
  if (!origins.length) return operation(false);
  const port = browser.runtime.connect({ name: hostPermissionPort });
  try {
    return await withHostPermissionUse(async () => {
      const granted = await browser.permissions.request({ origins }).catch(() => false);
      return operation(granted);
    });
  } finally {
    port.disconnect();
    await releaseUnusedHostPermissions().catch(() => undefined);
  }
}

export async function saveAiSettingsWithPermission(input: AiSettings & { apiKey?: string }) {
  const origin = endpointPermissionPattern(input.endpoint);
  if (input.enabled && !(await browser.permissions.contains({ origins: [origin] }))) {
    throw new Error("需要允许访问当前 Provider 域名，才能发送 AI 请求。");
  }
  return saveAiSettings(input);
}
