import { describe, expect, it } from "vitest";
import { expandSearchFields, indexedSearchFields, readSearchFields, readSearchScope, searchConditionCount, updateSearchFields, searchTimeStart, readSearchTimeRange, hasSearchResultIntent } from "./searchQuery";

describe("search field selections", () => {
  it("accepts legacy scalar and repeated URL fields and restores safe defaults", () => {
    expect(readSearchFields("description")).toEqual(["description"]);
    expect(readSearchFields(["siteHost", "tags", "tags", "invalid"])).toEqual(["tags", "siteHost"]);
    expect(readSearchFields(["invalid"])).toEqual(["all"]);
  });
  it("expands the legacy title-description preset into independently selected fields", () => {
    expect(readSearchFields(["title-description", "tags"])).toEqual(["title", "description", "tags"]);
    expect(readSearchFields(["title-description", "title"])).toEqual(["title", "description"]);
    expect(expandSearchFields(["title-description", "tags"])).toEqual(["title", "description", "tags"]);
  });
  it("lets individual fields be added or removed without replacing overlapping fields", () => {
    expect(updateSearchFields(["title", "description"], ["description"])).toEqual(["description"]);
    expect(updateSearchFields(["title", "description"], ["title", "description", "tags"])).toEqual(["title", "description", "tags"]);
    expect(updateSearchFields(["all"], ["description", "tags", "siteHost", "snapshotText"])).toEqual(["description", "tags", "siteHost", "snapshotText"]);
  });
  it("treats an empty chip selection as the explicit all-fields default", () => {
    expect(updateSearchFields(["title"], [])).toEqual(["all"]);
    expect(updateSearchFields(["tags"], ["invalid"])).toEqual(["all"]);
  });
  it("canonicalizes every nonempty actual-field subset without losing its meaning", () => {
    for (let mask = 1; mask < 1 << indexedSearchFields.length; mask++) {
      const fields = indexedSearchFields.filter((_, index) => mask & (1 << index));
      const canonical = readSearchFields(fields);
      expect(expandSearchFields(canonical) ?? [...indexedSearchFields]).toEqual(fields);
      expect(readSearchFields(canonical)).toEqual(canonical);
    }
    expect(readSearchFields([...indexedSearchFields])).toEqual(["all"]);
  });
  it("counts actual limited fields and dashboard tags, not the sidebar range", () => {
    expect(searchConditionCount({ query: "", scope: "follow", tagIds: [], fields: ["all"] })).toBe(0);
    expect(searchConditionCount({ query: "logo", scope: "website", tagIds: ["a"], fields: ["title", "siteHost"] })).toBe(3);
    expect(searchConditionCount({ query: "logo", scope: "website", tagIds: [], fields: [...indexedSearchFields] })).toBe(0);
    expect(searchConditionCount({ query: "logo", scope: "website", tagIds: [], fields: ["title-description"] })).toBe(2);
  });
  it("limits panel scope to the four content ranges", () => {
    expect(readSearchScope("follow")).toBe("follow");
    expect(readSearchScope("favorites")).toBe("all");
    expect(readSearchScope("unprocessed")).toBe("all");
  });
});


describe("search time ranges", () => {
  const now = new Date(2026, 9, 28, 14, 30).getTime();
  it("uses local calendar starts with seven and thirty inclusive calendar days", () => {
    expect(searchTimeStart("today", now)).toBe(new Date(2026, 9, 28).getTime());
    expect(searchTimeStart("week", now)).toBe(new Date(2026, 9, 22).getTime());
    expect(searchTimeStart("month", now)).toBe(new Date(2026, 8, 29).getTime());
    expect(searchTimeStart("year", now)).toBe(new Date(2026, 0, 1).getTime());
    expect(searchTimeStart("all", now)).toBeNull();
  });
  it.each([
    [new Date(2026, 0, 4, 12), new Date(2025, 11, 29)],
    [new Date(2026, 0, 5, 12), new Date(2025, 11, 30)],
    [new Date(2024, 2, 2, 12), new Date(2024, 1, 25)],
    [new Date(2026, 2, 10, 12), new Date(2026, 2, 4)],
  ])("counts seven local dates across week, year, leap-day and DST boundaries (%s)", (current, start) => {
    expect(searchTimeStart("week", current.getTime())).toBe(start.getTime());
  });
  it("keeps the persisted week key readable", () => {
    expect(readSearchTimeRange("week")).toBe("week");
    expect(readSearchTimeRange("corrupt")).toBe("all");
  });
  it("treats type, date and exact tags as result intent, but not field selection alone", () => {
    const base = { query: "", scope: "all" as const, tagIds: [] };
    expect(hasSearchResultIntent(base)).toBe(false);
    expect(hasSearchResultIntent({ ...base, timeRange: "today" })).toBe(true);
    expect(hasSearchResultIntent({ ...base, tagIds: ["a"] })).toBe(true);
    expect(hasSearchResultIntent({ ...base, scope: "article" })).toBe(true);
  });
});
