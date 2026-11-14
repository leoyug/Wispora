import { withRequestedHostPermissions } from "@/src/ai/hostPermissions";
import type { CaptureResponse, ExtensionRequest } from "@/src/capture/types";
import { inspirationRepository } from "@/src/db/repository";
import type { SavedItemKind } from "@/src/domain/inspiration";

export function capturePermissionPattern(value: string) {
  const url = new URL(value);
  return `${url.protocol}//${url.hostname}/*`;
}

export async function importSavedUrls(kind: SavedItemKind, urls: string[], enrichMetadata: boolean) {
  const origins = enrichMetadata ? [...new Set(urls.map(capturePermissionPattern))] : [];
  return withRequestedHostPermissions(origins, async (granted) => {
    const result = await inspirationRepository.importUrls(kind, urls);
    if (!granted || !result.addedItems.length) return result;
    const items = result.addedItems.map(({ id, url }) => ({
      itemId: id, url, permissionPattern: capturePermissionPattern(url),
    }));
    const captures: CaptureResponse[] = await browser.runtime.sendMessage({
      type: "capture:remote-batch", items,
    } satisfies ExtensionRequest);
    const addedItems = result.addedItems.filter(({ id }, index) => {
      const capture = captures[index];
      return !capture?.ok || capture.itemId === id;
    });
    return { addedItems, added: addedItems.length, skipped: result.skipped + result.added - addedItems.length };
  });
}
