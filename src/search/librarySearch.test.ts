import { describe, expect, it } from "vitest";
import type { LibraryItem } from "@/src/domain/inspiration";
import { createLibrarySearchIndex, queryLibraryItems, searchLibrary } from "./librarySearch";

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
