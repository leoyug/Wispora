import { describe, expect, it } from "vitest";
import { createSearchHistoryRepository, normalizeRecentSearches } from "./searchHistory";
import type { LibraryQuery } from "./searchQuery";

const query: LibraryQuery = { query: "motion", scope: "all", fields: ["all"], tagIds: [] };
describe("recent searches", () => {
  it("upgrades scalar history fields and deduplicates equivalent multi-field selections", () => {
    const entries = normalizeRecentSearches([
      { ...query, fields: ["tags", "title-description"], usedAt: 3 },
      { ...query, fields: ["title", "description", "tags"], usedAt: 2 },
      { ...query, query: "legacy", fields: undefined, field: "description", usedAt: 1 },
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.fields).toEqual(["title", "description", "tags"]);
    expect(entries[1]?.fields).toEqual(["description"]);
  });
  it("preserves visible exact tag ranges, deduplicates equivalent conditions and caps at six", () => {
    const entries = normalizeRecentSearches([
      { ...query, query: "  Motion  design ", tagIds: ["b", "a", "a"], usedAt: 30 },
      { ...query, query: "motion design", tagIds: ["a", "b"], usedAt: 20 },
      ...Array.from({ length: 9 }, (_, n) => ({ ...query, query: String(n), usedAt: n })),
    ]);
    expect(entries).toHaveLength(6);
    expect(entries[0]).toMatchObject({ query: "Motion design", tagIds: ["a", "b"] });
  });
  it("ignores unfiltered empty searches and corrupt records, retaining meaningful filter-only searches", () => {
    expect(normalizeRecentSearches([null, { ...query, query: "", usedAt: 1 }, { ...query, query: "", fields: ["snapshotText"], usedAt: 1 }, { ...query, scope: "bad", usedAt: 2 }])).toEqual([]);
    expect(normalizeRecentSearches([{ ...query, query: "", tagIds: ["deleted-tag"], usedAt: 1 }])[0]?.tagIds).toEqual(["deleted-tag"]);
    expect(normalizeRecentSearches([{ ...query, query: "", scope: "website", tagIds: ["deleted-tag"], usedAt: 1 }])[0]).toMatchObject({ scope: "website", tagIds: ["deleted-tag"] });
  });
  it("keeps date and tag conditions distinct, and recovers old records without a time range", () => {
    const entries = normalizeRecentSearches([
      { ...query, timeRange: "today", tagIds: ["a"], usedAt: 5 },
      { ...query, timeRange: "week", tagIds: ["a"], usedAt: 4 },
      { ...query, timeRange: "today", tagIds: ["b"], usedAt: 3 },
      { ...query, query: "", timeRange: "year", usedAt: 2 },
      { ...query, usedAt: 1 },
    ]);
    expect(entries).toHaveLength(5);
    expect(entries[4]?.timeRange).toBe("all");
    expect(entries[3]?.timeRange).toBe("year");
  });
  it("serializes writes and clearing without losing adjacent submissions", async () => {
    let stored: unknown = [];
    const repository = createSearchHistoryRepository({ read: async () => stored, write: async (value) => { stored = value; } });
    await Promise.all([repository.record(query), repository.record({ ...query, fields: ["title"] })]);
    expect(await repository.list()).toHaveLength(2);
    expect(await repository.clear()).toBe(true);
    expect(await repository.list()).toEqual([]);
  });
  it("does not reject when storage is unavailable", async () => {
    const repository = createSearchHistoryRepository({ read: async () => { throw new Error("unavailable"); }, write: async () => { throw new Error("quota"); } });
    expect(await repository.list()).toEqual([]);
    expect(await repository.record(query)).toBe(false);
    expect(await repository.clear()).toBe(false);
  });
});
