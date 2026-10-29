import { expandSearchFields, hasSearchResultIntent, readSearchFields, readSearchTimeRange, type LibraryQuery } from "./searchQuery";

export interface RecentSearch extends LibraryQuery { usedAt: number }
export const SEARCH_HISTORY_KEY = "wispora.search.history";
const scopes = new Set(["all", "website", "article", "follow", "favorites", "unprocessed"]);

export function normalizeRecentSearches(value: unknown): RecentSearch[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry): RecentSearch[] => {
    if (!entry || typeof entry !== "object" || typeof entry.query !== "string" || !scopes.has(entry.scope)
      || !Array.isArray(entry.tagIds) || !entry.tagIds.every((id: unknown) => typeof id === "string")
      || typeof entry.usedAt !== "number" || !Number.isFinite(entry.usedAt)) return [];
    return [{ query: entry.query.trim().replace(/\s+/g, " "), scope: entry.scope, tagIds: [...new Set<string>(entry.tagIds)].sort(), timeRange: readSearchTimeRange(entry.timeRange), fields: readSearchFields(entry.fields ?? entry.field), usedAt: entry.usedAt }];
  }).sort((a, b) => b.usedAt - a.usedAt).filter((entry) => {
    if (!hasSearchResultIntent(entry)) return false;
    const key = JSON.stringify([entry.query.toLocaleLowerCase(), entry.scope, expandSearchFields(entry.fields) ?? "all", entry.tagIds, entry.timeRange]);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 6);
}

export interface SearchHistoryStorage { read: () => Promise<unknown>; write: (value: RecentSearch[]) => Promise<void> }
const storage: SearchHistoryStorage = {
  async read() {
    if (typeof browser !== "undefined" && browser.runtime?.id) return (await browser.storage.local.get(SEARCH_HISTORY_KEY))[SEARCH_HISTORY_KEY];
    const value = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    return value ? JSON.parse(value) : [];
  },
  async write(value) {
    if (typeof browser !== "undefined" && browser.runtime?.id) await browser.storage.local.set({ [SEARCH_HISTORY_KEY]: value });
    else window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(value));
  },
};

export function createSearchHistoryRepository(adapter: SearchHistoryStorage = storage) {
  let queue: Promise<unknown> = Promise.resolve();
  const read = async () => { try { return normalizeRecentSearches(await adapter.read()); } catch { return []; } };
  const mutate = (update: (current: RecentSearch[]) => RecentSearch[]) => {
    const operation = queue.then(async () => {
      const next = update(await read());
      try { await adapter.write(next); return true; } catch { return false; }
    });
    queue = operation.catch(() => false);
    return operation;
  };
  return {
    list: read,
    record: (query: LibraryQuery) => mutate((current) => normalizeRecentSearches([{ ...query, usedAt: Date.now() }, ...current])),
    clear: () => mutate(() => []),
  };
}
export const searchHistoryRepository = createSearchHistoryRepository();
export type SearchHistoryRepository = ReturnType<typeof createSearchHistoryRepository>;
