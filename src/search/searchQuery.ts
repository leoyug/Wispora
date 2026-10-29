import type { LibraryScope } from "@/src/domain/inspiration";

export const searchFields = ["all", "title-description", "tags", "title", "description", "siteHost", "snapshotText"] as const;
export type SearchField = typeof searchFields[number];
export type IndexedSearchField = Exclude<SearchField, "all" | "title-description">;
export const indexedSearchFields = ["title", "description", "tags", "siteHost", "snapshotText"] as const satisfies readonly IndexedSearchField[];
export const searchScopes = ["all", "website", "article", "follow"] as const;
export type SearchScope = typeof searchScopes[number];
export const searchTimeRanges = ["today", "week", "month", "year"] as const;
export type SearchTimeRange = "all" | typeof searchTimeRanges[number];
export const searchTimeLabels: Record<SearchTimeRange, string> = { all: "不限时间", today: "今天", week: "过去 7 天", month: "过去 30 天", year: "今年" };
export function readSearchTimeRange(value: unknown): SearchTimeRange {
  return searchTimeRanges.includes(value as typeof searchTimeRanges[number]) ? value as SearchTimeRange : "all";
}
/** Inclusive calendar-day ranges follow the user's local timezone; week keeps its persisted key. */
export function searchTimeStart(range: SearchTimeRange = "all", now = Date.now()): number | null {
  if (range === "all") return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "week") start.setDate(start.getDate() - 6);
  else if (range === "month") start.setDate(start.getDate() - 29);
  else if (range === "year") start.setMonth(0, 1);
  return start.getTime();
}
export function readSearchScope(value: LibraryScope): SearchScope {
  return searchScopes.includes(value as SearchScope) ? value as SearchScope : "all";
}
export interface LibraryQuery {
  query: string;
  scope: LibraryScope;
  tagIds: string[];
  fields: SearchField[];
  timeRange?: SearchTimeRange;
}
export const searchFieldLabels: Record<SearchField, string> = {
  all: "全部字段", "title-description": "标题及描述", tags: "标签", title: "标题",
  description: "描述", siteHost: "域名", snapshotText: "快照正文",
};
export const scopeLabels: Record<LibraryScope, string> = {
  all: "全部收藏", website: "网站", article: "文章", follow: "关注源", favorites: "星标", unprocessed: "未处理",
};
/** Decode legacy presets at the boundary; live selections contain only actual fields or all. */
export function readSearchFields(value: unknown): SearchField[] {
  const selected = new Set((Array.isArray(value) ? value : [value]).filter((field): field is SearchField => searchFields.includes(field as SearchField)));
  if (!selected.size || selected.has("all")) return ["all"];
  if (selected.has("title-description")) { selected.add("title"); selected.add("description"); }
  const fields = indexedSearchFields.filter((field) => selected.has(field));
  return fields.length === indexedSearchFields.length ? ["all"] : fields;
}
export function expandSearchFields(fields: readonly SearchField[]): IndexedSearchField[] | undefined {
  const selected = readSearchFields(fields);
  if (selected.includes("all")) return undefined;
  return selected as IndexedSearchField[];
}
export function updateSearchFields(_current: readonly SearchField[], next: readonly string[]): SearchField[] {
  const fields = next.filter((field) => indexedSearchFields.includes(field as IndexedSearchField));
  return readSearchFields(fields);
}
export function searchConditionCount(query: LibraryQuery) {
  const fields = readSearchFields(query.fields);
  return query.tagIds.length + (fields.includes("all") ? 0 : fields.length) + Number(readSearchTimeRange(query.timeRange) !== "all");
}

export function hasSearchResultIntent(query: Pick<LibraryQuery, "query" | "scope" | "tagIds" | "timeRange">) {
  return Boolean(query.query.trim() || query.scope !== "all" || query.tagIds.length || readSearchTimeRange(query.timeRange) !== "all");
}
