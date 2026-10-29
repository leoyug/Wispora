import MiniSearch from "minisearch";
import { isSavedItemProcessed, type LibraryItem, type LibraryScope } from "@/src/domain/inspiration";
import { expandSearchFields, readSearchTimeRange, searchTimeStart, type SearchField, type SearchTimeRange } from "./searchQuery";

export type LibrarySortOrder = "newest" | "oldest" | "relevance";

type SearchRecord = Pick<LibraryItem, "id" | "title" | "description" | "siteHost" | "snapshotText"> & { tags: string };

export function tokenize(text: string) {
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
      combineWith: "AND",
    },
  });
  index.addAll(indexedItems.map((item) => ({
    id: item.id, title: item.title, description: item.description, siteHost: item.siteHost,
    tags: item.tags.join(" "), snapshotText: item.snapshotText,
  })));
  const allIds = new Set(indexedItems.map((item) => item.id));
  let cachedKey: string | undefined;
  let cachedResults: ReturnType<typeof index.search> = [];
  const results = (query: string, fields: readonly SearchField[] = ["all"]) => {
    const indexedFields = expandSearchFields(fields);
    const key = `${indexedFields?.join(",") ?? "all"}\0${query.trim()}`;
    if (cachedKey !== key) {
      cachedResults = index.search(query.trim(), { fields: indexedFields });
      cachedKey = key;
    }
    return cachedResults;
  };
  return {
    search(query: string) {
      const normalized = query.trim();
      return normalized ? new Set(index.search(normalized).map((result) => String(result.id))) : allIds;
    },
    results,
    scores(query: string, fields?: readonly SearchField[]): ReadonlyMap<string, number> {
      return new Map(results(query, fields).map((result) => [String(result.id), result.score]));
    },
  };
}

export type LibrarySearchIndex = ReturnType<typeof createLibrarySearchIndex>;

export function queryLibraryItems(items: LibraryItem[], index: LibrarySearchIndex | null, options: {
  query: string;
  scope: LibraryScope;
  tags?: readonly string[];
  tagIds?: readonly string[];
  fields?: readonly SearchField[];
  timeRange?: SearchTimeRange;
  now?: number;
  sort: LibrarySortOrder;
}) {
  const hasQuery = Boolean(options.query.trim());
  const now = options.now ?? Date.now();
  const since = searchTimeStart(readSearchTimeRange(options.timeRange), now);
  if (hasQuery && !index) throw new Error("Local search index unavailable");
  const scores = hasQuery ? index!.scores(options.query, options.fields) : null;
  const fields = expandSearchFields(options.fields ?? ["all"]);
  const normalized = options.query.trim().toLocaleLowerCase();
  const exact = (item: LibraryItem) => Number(((!fields || fields.includes("title")) && item.title.toLocaleLowerCase() === normalized)
    || ((!fields || fields.includes("siteHost")) && item.siteHost.toLocaleLowerCase() === normalized));
  const matches = items.filter((item) => {
    if (item.archivedAt || (scores && !scores.has(item.id)) || (since !== null && (item.createdAt < since || item.createdAt > now))) return false;
    const scopeMatches = options.scope === "all" || (options.scope === "favorites" ? item.isFavorite
      : options.scope === "unprocessed" ? !isSavedItemProcessed(item) : item.kind === options.scope);
    return scopeMatches && (options.tags ?? []).every((tag) => item.tags.includes(tag))
      && (options.tagIds ?? []).every((id) => item.tagIds.includes(id));
  });
  return matches.sort((a, b) => {
    if (options.sort === "relevance" && scores) {
      const priority = exact(b) - exact(a);
      if (priority) return priority;
      const relevance = scores.get(b.id)! - scores.get(a.id)!;
      if (relevance) return relevance;
    }
    const date = options.sort === "oldest" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
    return date || a.id.localeCompare(b.id);
  });
}

/** Count candidates after keyword/scope filtering, excluding each candidate's own selection. */
export function countSearchFacets(items: LibraryItem[], index: LibrarySearchIndex | null, options: { query: string; scope: LibraryScope; fields: readonly SearchField[]; tagIds: readonly string[] }, candidateIds: readonly string[]) {
  const matches = queryLibraryItems(items, index, { ...options, sort: "newest" });
  const counts = new Map(candidateIds.map((id) => [id, 0]));
  // For a selected candidate, excluding itself and requiring that candidate again
  // is equivalent to the full AND set. Count each item/tag once, without rescanning
  // the library for every candidate or reading snapshot text here.
  for (const item of matches) for (const id of new Set(item.tagIds)) {
    if (counts.has(id)) counts.set(id, counts.get(id)! + 1);
  }
  return counts;
}

export interface SearchPresentation { text: string; source: "description" | "snapshotText" | "tags"; titleTerms: string[]; terms: string[] }

export function selectSearchPreview(items: LibraryItem[], showResults: boolean) {
  return showResults ? items.slice(0, 8) : items.filter((item) => item.lastOpenedAt).sort((a, b) => b.lastOpenedAt! - a.lastOpenedAt! || a.id.localeCompare(b.id)).slice(0, 4);
}

/** Keep the captured preview order while skipping items that are no longer available. */
export function getAdjacentSearchPreviewId(previewIds: readonly string[], items: readonly LibraryItem[], currentId: string | null, direction: -1 | 1) {
  const availableIds = new Set(items.filter((item) => !item.archivedAt).map((item) => item.id));
  const sequence = previewIds.filter((id) => availableIds.has(id));
  const index = currentId === null ? -1 : sequence.indexOf(currentId);
  if (index === -1) return null;
  return sequence[(index + direction + sequence.length) % sequence.length] ?? null;
}

/** Called only for the visible eight results; never scan every matching snapshot. */
export function createSearchPresentations(items: LibraryItem[], index: LibrarySearchIndex | null, query: string, fields: readonly SearchField[]): ReadonlyMap<string, SearchPresentation> {
  const hits = new Map(query.trim() && index ? index.results(query, fields).map((hit) => [String(hit.id), hit]) : []);
  return new Map(items.slice(0, 8).map((item) => {
    const hit = hits.get(item.id);
    const termsFor = (name: string) => Object.entries(hit?.match ?? {}).filter(([, fields]) => fields.includes(name)).map(([term]) => term);
    const source = termsFor("description").length ? "description" : termsFor("snapshotText").length ? "snapshotText" : termsFor("tags").length ? "tags" : "description";
    const terms = termsFor(source);
    const fullText = (source === "tags" ? item.tags.join(" · ") : item[source]).replace(/\s+/g, " ");
    const lower = fullText.toLocaleLowerCase();
    const offsets = terms.map((term) => lower.indexOf(term)).filter((offset) => offset >= 0);
    const start = Math.max(0, (offsets.length ? Math.min(...offsets) : 0) - 36);
    const end = Math.min(fullText.length, start + 160);
    const text = `${start ? "…" : ""}${fullText.slice(start, end)}${end < fullText.length ? "…" : ""}`;
    return [item.id, { text, source, terms, titleTerms: termsFor("title") }];
  }));
}

export function highlightSearchText(text: string, terms: readonly string[]) {
  const lower = text.toLocaleLowerCase();
  const ranges: Array<[number, number]> = [];
  for (const term of terms.filter(Boolean)) {
    let offset = lower.indexOf(term.toLocaleLowerCase());
    while (offset >= 0) { ranges.push([offset, offset + term.length]); offset = lower.indexOf(term.toLocaleLowerCase(), offset + term.length); }
  }
  const merged: Array<[number, number]> = [];
  for (const [start, end] of ranges.sort((a, b) => a[0] - b[0])) {
    const previous = merged.at(-1);
    if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
    else merged.push([start, end]);
  }
  const parts: Array<{ text: string; match: boolean }> = [];
  let offset = 0;
  for (const [start, end] of merged) {
    if (start > offset) parts.push({ text: text.slice(offset, start), match: false });
    parts.push({ text: text.slice(start, end), match: true }); offset = end;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset), match: false });
  return parts;
}

export function searchLibrary(items: LibraryItem[], query: string) {
  return createLibrarySearchIndex(items).search(query);
}
