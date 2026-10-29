import { describe, expect, it } from "vitest";
import type { LibraryItem } from "@/src/domain/inspiration";
import { countSearchFacets, createSearchPresentations, getAdjacentSearchPreviewId, highlightSearchText, createLibrarySearchIndex, queryLibraryItems, searchLibrary, selectSearchPreview } from "./librarySearch";

const base = {
  originalUrl: "https://example.com", canonicalUrl: "https://example.com", url: "https://example.com",
  siteHost: "example.com", sourceLabel: "example.com", title: "Grid system", description: "Layout reference",
  descriptionSource: "page" as const, cover: { background: "", foreground: "", label: "", motif: "grid" as const },
  kind: "article" as const, tagIds: [], tags: ["设计"], isFavorite: false, snapshotStatus: "complete" as const,
  aiStatus: "pending" as const, createdAt: 1, updatedAt: 1, savedAt: "刚刚", snapshotText: "正文讨论响应式排版与无障碍设计",
};

describe("searchLibrary", () => {
  const items: LibraryItem[] = [{ ...base, id: "one" }, { ...base, id: "two", title: "Motion", tags: ["动效"], snapshotText: "spring animation" }];
  it("searches title and tags with useful weighting", () => expect([...searchLibrary(items, "Grid")]).toEqual(["one"]));
  it("finds Chinese terms that only exist in snapshot text", () => expect([...searchLibrary(items, "无障碍")]).toEqual(["one"]));
  it("supports English prefixes", () => expect([...searchLibrary(items, "anim")]).toEqual(["two"]));
});

describe("phase two search semantics", () => {
  const items: LibraryItem[] = [
    { ...base, id: "exact", title: "Motion", siteHost: "motion.dev", description: "spring guide", tagIds: ["design", "animation"], tags: ["Design", "Animation"] },
    { ...base, id: "prefix", title: "Motion design toolkit", description: "layout", tagIds: ["design"], tags: ["Design"], createdAt: 20 },
    { ...base, id: "body", title: "Reading", description: "A reference", snapshotText: `${"Earlier text. ".repeat(100)}spring motion with accessible interfaces`, tagIds: ["animation"], tags: ["Animation"] },
    { ...base, id: "archived", title: "Motion", archivedAt: 30, tagIds: ["design", "animation"] },
  ];
  const index = createLibrarySearchIndex(items);
  const options = { query: "motion", scope: "all" as const, fields: ["all"] as const, tagIds: [], sort: "relevance" as const };
  it("prioritizes an exact title and keeps the same keywords in the selected fields only", () => {
    expect(queryLibraryItems(items, index, options)[0]?.id).toBe("exact");
    expect(queryLibraryItems(items, index, { ...options, fields: ["snapshotText"] }).map((item) => item.id)).toEqual(["body"]);
    expect(queryLibraryItems(items, index, { ...options, fields: ["description"] })).toEqual([]);
    expect(queryLibraryItems(items, index, { ...options, query: "spring", fields: ["title-description"] }).map((item) => item.id)).toEqual(["exact"]);
  });
  it("requires all keywords, including matches distributed across fields", () => {
    expect(queryLibraryItems(items, index, { ...options, query: "motion spring" }).map((item) => item.id)).toEqual(["exact", "body"]);
    expect(queryLibraryItems(items, index, { ...options, query: "motion nonexistent" })).toEqual([]);
    expect(queryLibraryItems(items, index, { ...options, query: "motion spring", fields: ["title"] })).toEqual([]);
  });
  it("matches any selected field while requiring every keyword across their union", () => {
    expect(queryLibraryItems(items, index, { ...options, fields: ["title", "description"], query: "motion spring" }).map((item) => item.id)).toEqual(["exact"]);
    expect(queryLibraryItems(items, index, { ...options, fields: ["title", "tags"] }).map((item) => item.id)).toEqual(["exact", "prefix"]);
    expect(queryLibraryItems(items, index, { ...options, fields: ["description", "tags"], query: "spring" }).map((item) => item.id)).toEqual(["exact"]);
    expect(queryLibraryItems(items, index, { ...options, fields: ["title", "description"], query: "motion missing" })).toEqual([]);
  });
  it("keeps tag identity through a rename, and deleted identities continue to constrain results", () => {
    expect(queryLibraryItems(items, index, { ...options, tagIds: ["design", "animation"] }).map((item) => item.id)).toEqual(["exact"]);
    expect(queryLibraryItems(items, index, { ...options, tagIds: ["deleted"] })).toEqual([]);
  });
  it("counts each candidate after other selected tags and excludes archives", () => {
    const counts = countSearchFacets(items, index, { ...options, tagIds: ["design", "animation"] }, ["design", "animation", "missing"]);
    expect([...counts]).toEqual([["design", 1], ["animation", 1], ["missing", 0]]);
    expect(countSearchFacets(items, index, { ...options, tagIds: ["design"] }, ["design"]).get("design")).toBe(2);
  });
  it("does not require a snapshot when the keyword is empty", () => {
    expect(queryLibraryItems(items, index, { ...options, query: "", fields: ["snapshotText"] })).toHaveLength(3);
  });
  it("extracts context around a body match and highlights actual matching text safely", () => {
    const presentation = createSearchPresentations([items[2]!], index, "spring motion", ["snapshotText"]).get("body")!;
    expect(presentation.source).toBe("snapshotText");
    expect(presentation.text).toContain("spring motion");
    expect(presentation.text.length).toBeLessThanOrEqual(162);
    expect(highlightSearchText("<script>Motion</script>", ["motion"])).toEqual([{ text: "<script>", match: false }, { text: "Motion", match: true }, { text: "</script>", match: false }]);
    expect(highlightSearchText("Animation", ["anim", "animation"])).toEqual([{ text: "Animation", match: true }]);
  });
  it("generates presentations for at most eight results", () => {
    expect(createSearchPresentations(Array.from({ length: 12 }, (_, n) => ({ ...base, id: `entry-${n}` })), null, "", ["all"]).size).toBe(8);
  });
});

describe("library search results", () => {
  const query = { query: "motion", scope: "all" as const, tags: [], sort: "relevance" as const };
  const items: LibraryItem[] = [
    { ...base, id: "older-title", title: "Motion", description: "Interface references", createdAt: 1, tags: ["交互", "设计"] },
    { ...base, id: "newer-description", title: "Collection", description: "Motion", createdAt: 20, tags: ["设计"], isFavorite: true },
    { ...base, id: "archived", title: "Motion", createdAt: 30, archivedAt: 40 },
  ];
  const index = createLibrarySearchIndex(items);

  it("keeps relevant older titles ahead of newer weak matches and excludes archives", () => {
    expect(queryLibraryItems(items, index, query).map((item) => item.id)).toEqual(["older-title", "newer-description"]);
  });
  it("shares exact scope and all-tag conditions between preview and full results", () => {
    expect(queryLibraryItems(items, index, { ...query, tags: ["交互", "设计"] }).map((item) => item.id)).toEqual(["older-title"]);
    expect(queryLibraryItems(items, index, { ...query, scope: "favorites" }).map((item) => item.id)).toEqual(["newer-description"]);
    expect(queryLibraryItems(items, index, { ...query, scope: "website" })).toEqual([]);
  });
  it("supports explicit date sorting and uses newest for an empty relevance query", () => {
    expect(queryLibraryItems(items, index, { ...query, sort: "newest" }).map((item) => item.id)).toEqual(["newer-description", "older-title"]);
    expect(queryLibraryItems(items, index, { ...query, query: "  " }).map((item) => item.id)).toEqual(["newer-description", "older-title"]);
  });
  it("uses date then stable ID for tied relevance without changing the source array", () => {
    const tied = ["z", "a"].map((id) => ({ ...base, id, title: "Motion" }));
    expect(queryLibraryItems(tied, createLibrarySearchIndex(tied), query).map((item) => item.id)).toEqual(["a", "z"]);
    expect(tied.map((item) => item.id)).toEqual(["z", "a"]);
  });
  it("returns full counts beyond eight preview rows and searches snapshot-only matches", () => {
    const many = Array.from({ length: 12 }, (_, n) => ({ ...base, id: String(n), title: "Example", snapshotText: "motion" }));
    expect(queryLibraryItems(many, createLibrarySearchIndex(many), query)).toHaveLength(12);
  });
  it("distinguishes an unavailable index from zero matches while keeping browsing available", () => {
    expect(() => queryLibraryItems(items, null, query)).toThrow("Local search index unavailable");
    expect(queryLibraryItems(items, null, { ...query, query: "" })).toHaveLength(2);
  });
});

describe("search preview detail navigation", () => {
  const recentItems = (count: number): LibraryItem[] => Array.from({ length: count }, (_, index) => ({
    ...base, id: String.fromCharCode(65 + index), lastOpenedAt: 100 - index,
  }));

  it.each([3, 4])("visits all %i recent items forwards despite each open changing their recency", (count) => {
    const items = recentItems(count);
    const previewIds = selectSearchPreview(items, false).map((item) => item.id);
    let current = previewIds[0]!;
    const visited = [current];
    for (let step = 0; step < count * 2; step++) {
      items.find((item) => item.id === current)!.lastOpenedAt = 200 + step;
      expect(selectSearchPreview(items, false)[0]?.id).toBe(current);
      current = getAdjacentSearchPreviewId(previewIds, items, current, 1)!;
      visited.push(current);
    }
    expect(visited).toEqual(count === 3 ? ["A", "B", "C", "A", "B", "C", "A"] : ["A", "B", "C", "D", "A", "B", "C", "D", "A"]);
  });

  it.each([3, 4])("visits all %i recent items backwards and wraps without reordering", (count) => {
    const items = recentItems(count);
    const previewIds = selectSearchPreview(items, false).map((item) => item.id);
    let current = "A";
    const visited = [current];
    for (let step = 0; step < count; step++) {
      items.find((item) => item.id === current)!.lastOpenedAt = 200 + step;
      current = getAdjacentSearchPreviewId(previewIds, items, current, -1)!;
      visited.push(current);
    }
    expect(visited).toEqual(count === 3 ? ["A", "C", "B", "A"] : ["A", "D", "C", "B", "A"]);
  });

  it("keeps the eight displayed search results and does not pull in new matches during a detail visit", () => {
    const items = recentItems(10);
    const previewIds = selectSearchPreview(items, true).map((item) => item.id);
    const updated = [{ ...base, id: "new-match" }, ...items.toReversed()];
    expect(getAdjacentSearchPreviewId(previewIds, updated, "H", 1)).toBe("A");
    expect(getAdjacentSearchPreviewId(previewIds, updated, "A", -1)).toBe("H");
    expect(getAdjacentSearchPreviewId(previewIds, updated, "D", 1)).toBe("E");
  });

  it("skips deleted and archived items without changing the remaining preview order", () => {
    const items = recentItems(4);
    const previewIds = selectSearchPreview(items, false).map((item) => item.id);
    const updated = items.filter((item) => item.id !== "B").map((item) => item.id === "C" ? { ...item, archivedAt: 300 } : item);
    expect(getAdjacentSearchPreviewId(previewIds, updated, "A", 1)).toBe("D");
    expect(getAdjacentSearchPreviewId(previewIds, updated, "D", -1)).toBe("A");
  });

  it("returns no destination when the preview or current item is unavailable", () => {
    const items = recentItems(3);
    expect(getAdjacentSearchPreviewId([], items, "A", 1)).toBeNull();
    expect(getAdjacentSearchPreviewId(["A", "B"], [], "A", -1)).toBeNull();
    expect(getAdjacentSearchPreviewId(["A", "B"], items, null, 1)).toBeNull();
    expect(getAdjacentSearchPreviewId(["A", "B"], items, "C", 1)).toBeNull();
  });

  it("stays on the current item when it is the only available preview", () => {
    const items = recentItems(1);
    expect(getAdjacentSearchPreviewId(["A"], items, "A", 1)).toBe("A");
    expect(getAdjacentSearchPreviewId(["A"], items, "A", -1)).toBe("A");
  });
});


describe("date-filtered library search", () => {
  it("includes the previous week's saved items within seven local dates, but excludes older and future items", () => {
    const now = new Date(2026, 9, 28, 14).getTime();
    const start = new Date(2026, 9, 22).getTime();
    const rows = [
      { ...base, id: "start", createdAt: start },
      { ...base, id: "before", createdAt: start - 1 },
      { ...base, id: "friday", createdAt: new Date(2026, 9, 23, 12).getTime() },
      { ...base, id: "now", createdAt: now },
      { ...base, id: "future", createdAt: now + 1 },
    ];
    expect(queryLibraryItems(rows, null, { query: "", scope: "all", timeRange: "week", now, sort: "newest" }).map((item) => item.id)).toEqual(["now", "friday", "start"]);
  });
  it("combines date, content type, tag identity and keywords, with inclusive start and no future dates", () => {
    const now = new Date(2026, 9, 28, 14).getTime();
    const midnight = new Date(2026, 9, 28).getTime();
    const rows = [
      { ...base, id: "start", title: "Motion", kind: "website" as const, tagIds: ["a"], createdAt: midnight },
      { ...base, id: "before", title: "Motion", kind: "website" as const, tagIds: ["a"], createdAt: midnight - 1 },
      { ...base, id: "future", title: "Motion", kind: "website" as const, tagIds: ["a"], createdAt: now + 1 },
      { ...base, id: "other-type", title: "Motion", kind: "article" as const, tagIds: ["a"], createdAt: now },
      { ...base, id: "other-tag", title: "Motion", kind: "website" as const, tagIds: ["b"], createdAt: now },
    ];
    const index = createLibrarySearchIndex(rows);
    expect(queryLibraryItems(rows, index, { query: "motion", scope: "website", tagIds: ["a"], fields: ["title"], timeRange: "today", now, sort: "relevance" }).map((item) => item.id)).toEqual(["start"]);
    expect(queryLibraryItems(rows, index, { query: "", scope: "all", timeRange: "today", now, sort: "newest" }).map((item) => item.id)).toEqual(["other-tag", "other-type", "start"]);
  });
});
