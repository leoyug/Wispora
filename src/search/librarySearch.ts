import MiniSearch from "minisearch";
import { isSavedItemProcessed, type LibraryItem, type LibraryScope } from "@/src/domain/inspiration";

export type LibrarySortOrder = "newest" | "oldest" | "relevance";

type SearchRecord = Pick<LibraryItem, "id" | "title" | "description" | "siteHost" | "snapshotText"> & { tags: string };

function tokenize(text: string) {
  if (!("Segmenter" in Intl)) return text.toLocaleLowerCase("zh-CN").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const segmenter = new Intl.Segmenter(["zh-CN", "en"], { granularity: "word" });
  return [...segmenter.segment(text.toLocaleLowerCase("zh-CN"))].filter((part) => part.isWordLike).map((part) => part.segment);
}

export function createLibrarySearchIndex(items: LibraryItem[]) {
  // Archived content must not affect the relevance statistics of active results.
  const indexedItems = items.filter((item) => !item.archivedAt);
  const index = new MiniSearch<SearchRecord>({
    fields: ["title", "description", "siteHost", "tags", "snapshotText"],
    storeFields: ["id"],
    tokenize,
    searchOptions: {
      prefix: true,
      fuzzy: (term) => term.length >= 5 ? 0.2 : false,
      boost: { title: 5, tags: 4, description: 3, siteHost: 2, snapshotText: 1 },
    },
  });
  index.addAll(indexedItems.map((item) => ({
    id: item.id, title: item.title, description: item.description, siteHost: item.siteHost,
    tags: item.tags.join(" "), snapshotText: item.snapshotText,
  })));
  const allIds = new Set(indexedItems.map((item) => item.id));
  return {
    search(query: string) {
      const normalized = query.trim();
      return normalized ? new Set(index.search(normalized).map((result) => String(result.id))) : allIds;
    },
    scores(query: string): ReadonlyMap<string, number> {
      return new Map(index.search(query.trim()).map((result) => [String(result.id), result.score]));
    },
  };
}

export type LibrarySearchIndex = ReturnType<typeof createLibrarySearchIndex>;

export function queryLibraryItems(items: LibraryItem[], index: LibrarySearchIndex | null, options: {
  query: string;
  scope: LibraryScope;
  tags: readonly string[];
  sort: LibrarySortOrder;
}) {
  const hasQuery = Boolean(options.query.trim());
  if (hasQuery && !index) throw new Error("Local search index unavailable");
  const scores = hasQuery ? index!.scores(options.query) : null;
  const matches = items.filter((item) => {
    if (item.archivedAt || (scores && !scores.has(item.id))) return false;
    const scopeMatches = options.scope === "all" || (options.scope === "favorites" ? item.isFavorite
      : options.scope === "unprocessed" ? !isSavedItemProcessed(item) : item.kind === options.scope);
    return scopeMatches && options.tags.every((tag) => item.tags.includes(tag));
  });
  return matches.sort((a, b) => {
    if (options.sort === "relevance" && scores) {
      const relevance = scores.get(b.id)! - scores.get(a.id)!;
      if (relevance) return relevance;
    }
    const date = options.sort === "oldest" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
    return date || a.id.localeCompare(b.id);
  });
}

export function searchLibrary(items: LibraryItem[], query: string) {
  return createLibrarySearchIndex(items).search(query);
}
