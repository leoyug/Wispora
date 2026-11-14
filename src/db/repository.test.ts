import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import type { SavedItem } from "@/src/domain/inspiration";
import type { PageCapture } from "@/src/capture/types";
import { getInspirationPresentation } from "@/src/components/inspiration/getInspirationPresentation";
import { WisporaDatabase } from "./database";
import { InspirationRepository } from "./repository";

const databaseNames: string[] = [];

function createDatabase() {
  const name = `wanderland-test-${crypto.randomUUID()}`;
  databaseNames.push(name);
  return new WisporaDatabase(name);
}

function createCapture(overrides: Partial<PageCapture> = {}): PageCapture {
  return {
    url: "https://example.com/article",
    canonicalUrl: "https://example.com/article",
    title: "A captured article",
    description: "Page description",
    cleanText: "Readable article text",
    cleanHtml: "<article><p>Readable article text</p></article>",
    completeness: "complete",
    favicon: "https://example.com/favicon.ico",
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(databaseNames.splice(0).map((name) => Dexie.delete(name)));
});

describe("InspirationRepository", () => {
  it("toggles reading status only for articles and starts reclassified items unread", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const url = "https://example.com/reading";
    const { item } = await repository.createSavedItem({ kind: "article", url });
    expect(item.isRead).toBeUndefined();
    await repository.toggleArticleRead(item.id);
    expect((await repository.getSavedItem(item.id))?.isRead).toBe(true);
    await repository.toggleArticleRead(item.id);
    expect((await repository.getSavedItem(item.id))?.isRead).toBe(false);

    await repository.toggleArticleRead(item.id);
    const edit = { title: item.title, description: "", tags: [] };
    await repository.updateSavedItem(item.id, { ...edit, kind: "website" });
    await repository.toggleArticleRead(item.id);
    expect((await repository.getSavedItem(item.id))?.isRead).toBeUndefined();
    await repository.updateSavedItem(item.id, { ...edit, kind: "article" });
    expect((await repository.getSavedItem(item.id))?.isRead).toBeUndefined();
    database.close();
  });

  it("records real detail opens without changing the saved or edited timestamp", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const { item } = await repository.createSavedItem({ kind: "article", url: "https://example.com/recent" });
    expect(item.lastOpenedAt).toBeUndefined();
    await repository.markOpened(item.id);
    const opened = await database.savedItems.get(item.id);
    expect(opened?.lastOpenedAt).toBeGreaterThanOrEqual(item.createdAt);
    expect(opened?.updatedAt).toBe(item.updatedAt);
    database.close();
  });
  it("deduplicates normalized URLs within the same content type", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);

    const first = await repository.createSavedItem({ kind: "website", url: "https://Example.com/work/?utm_source=test#intro" });
    const duplicate = await repository.createSavedItem({ kind: "website", url: "https://example.com/work" });
    const otherKind = await repository.createSavedItem({ kind: "article", url: "https://example.com/work" });

    expect(first.created).toBe(true);
    expect(duplicate).toEqual({ created: false, item: first.item });
    expect(otherKind.created).toBe(true);
    expect(await database.savedItems.count()).toBe(2);
    expect(await database.tasks.count()).toBe(4);
    database.close();
  });

  it("returns the newly created records needed for post-import metadata capture", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    await repository.createSavedItem({ kind: "website", url: "https://example.com/existing" });

    const result = await repository.importWebsiteUrls([
      "https://example.com/existing",
      "https://example.com/new",
      "https://other.example/page",
    ]);

    expect(result).toMatchObject({ added: 2, skipped: 1 });
    expect(result.addedItems.map((item) => item.url)).toEqual([
      "https://example.com/new",
      "https://other.example/page",
    ]);
    expect(result.addedItems.every((item) => item.id.length > 0)).toBe(true);
    expect(new Set(result.addedItems.map((item) => item.id)).size).toBe(2);
    database.close();
  });

  it("undoes a batch import without removing existing items or leaving snapshots and tasks", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const existing = await repository.createSavedItem({ kind: "website", url: "https://example.com/existing" });
    const imported = await repository.importWebsiteUrls([
      "https://example.com/existing",
      "https://example.com/new-one",
      "https://example.com/new-two",
    ]);
    const importedIds = imported.addedItems.map((item) => item.id);
    const firstImportedId = importedIds[0];
    if (!firstImportedId) throw new Error("批量导入未创建收藏项");
    await repository.completeCapture(firstImportedId, createCapture({
      url: "https://example.com/new-one",
      canonicalUrl: "https://example.com/new-one",
    }));

    expect(await repository.deleteSavedItems([...importedIds, firstImportedId])).toBe(2);
    expect(await repository.deleteSavedItems(importedIds)).toBe(0);
    expect((await database.savedItems.toArray()).map((item) => item.id)).toEqual([existing.item.id]);
    expect(await database.snapshots.where("itemId").anyOf(importedIds).count()).toBe(0);
    expect(await database.tasks.where("itemId").anyOf(importedIds).count()).toBe(0);
    expect(await database.tasks.where("itemId").equals(existing.item.id).count()).toBe(2);
    database.close();
  });

  it("imports pasted URLs using the selected content type", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);

    await repository.importUrls("follow", ["https://creator.example/profile", "https://creator.example/blog"]);

    expect((await database.savedItems.toArray()).map((item) => item.kind)).toEqual(["follow", "follow"]);
    database.close();
  });

  it("keeps same-site subpages separate and gives them distinct temporary identities", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    await repository.createSavedItem({ kind: "website", url: "https://example.com/gallery/web-design" });
    await repository.createSavedItem({ kind: "website", url: "https://example.com/gallery/motion-design" });

    const items = await repository.listLibraryItems();
    expect(items).toHaveLength(2);
    expect(new Set(items.map((item) => item.title))).toEqual(new Set(["gallery › motion design", "gallery › web design"]));
    expect(new Set(items.map((item) => item.sourceLabel))).toEqual(new Set([
      "example.com/gallery/motion-design",
      "example.com/gallery/web-design",
    ]));
    database.close();
  });

  it("persists favorite and saved-view state across database instances", async () => {
    const database = createDatabase();
    const name = database.name;
    const repository = new InspirationRepository(database);
    await repository.initialize();
    const created = await repository.createSavedItem({ kind: "article", url: "https://example.com/read" });
    await repository.toggleFavorite(created.item.id);
    const view = await repository.createSavedView({ name: "本周阅读", scope: "article", tags: [] });
    database.close();

    const reopened = new WisporaDatabase(name);
    const reopenedRepository = new InspirationRepository(reopened);
    expect((await reopenedRepository.listLibraryItems())[0]?.isFavorite).toBe(true);
    expect((await reopenedRepository.listLibrarySavedViews()).map((candidate) => candidate.id)).toContain(view.id);
    reopened.close();
  });

  it("persists archive state and allows restoring an item", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com/archive-me" });

    await repository.setArchived(created.item.id, true);
    expect((await repository.listLibraryItems())[0]?.archivedAt).toEqual(expect.any(Number));

    await repository.setArchived(created.item.id, false);
    expect((await repository.listLibraryItems())[0]?.archivedAt).toBeUndefined();
    database.close();
  });

  it("keeps existing records when upgrading the schema", async () => {
    const name = `wanderland-migration-${crypto.randomUUID()}`;
    databaseNames.push(name);
    const legacy = new Dexie(name);
    legacy.version(1).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,aiStatus,createdAt,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt",
    });
    await legacy.open();
    const legacyItem = {
      id: "legacy-item",
      originalUrl: "https://example.com/legacy",
      canonicalUrl: "https://example.com/legacy",
      siteHost: "example.com",
      title: "Legacy",
      description: "",
      cover: { background: "#fff", foreground: "#000", label: "Legacy", motif: "type" },
      kind: "website",
      isFavorite: false,
      aiStatus: "pending",
      createdAt: 100,
      updatedAt: 100,
    };
    await legacy.table("savedItems").add(legacyItem);
    legacy.close();

    const upgraded = new WisporaDatabase(name);
    await upgraded.open();
    const item = await upgraded.savedItems.get("legacy-item") as SavedItem;
    expect(item.title).toBe("Legacy");
    expect(item.tagIds).toEqual([]);
    expect(item.snapshotStatus).toBe("pending");
    expect(await upgraded.snapshots.count()).toBe(0);
    upgraded.close();
  });

  it("stores a clean X article title and lets AI fill a title-only preview", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const url = "https://x.com/example/status/123";
    const { item } = await repository.createSavedItem({ kind: "article", url });
    await repository.completeCapture(item.id, createCapture({
      url,
      canonicalUrl: url,
      title: "Example (@example) on X",
      documentTitle: "(5) X 上的 Example：“How I work with Agents” / X",
      description: "How I work with Agents https://t.co/example",
    }));

    expect(await database.savedItems.get(item.id)).toMatchObject({
      title: "How I work with Agents",
      description: "",
    });
    const [task] = await repository.listRunnableAiTasks();
    await repository.markAiStarted(task!.id);
    await repository.completeAiTask(task!.id, { description: "The article explains how to delegate work to agents.", tags: ["AI"] });
    expect(await database.savedItems.get(item.id)).toMatchObject({
      description: "The article explains how to delegate work to agents.",
      descriptionSource: "ai",
    });
    database.close();
  });

  it("refreshes an existing article cover without replacing the snapshot or a manually selected cover", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const url = "https://example.com/article";
    const { item } = await repository.createSavedItem({ kind: "article", url });
    await repository.completeCapture(item.id, createCapture({ ogImage: "https://example.com/brand.png" }));
    const snapshot = await repository.getSnapshot(item.id);
    const image = "https://example.com/article.webp";
    expect(await repository.refreshArticleCover(item.id, url, image)).toBe(true);
    expect((await repository.getSavedItem(item.id))?.cover.image).toBe(image);
    expect(await repository.getSnapshot(item.id)).toEqual(snapshot);

    await repository.updateSavedItem(item.id, {
      title: "A captured article", description: "Page description", tags: [],
      coverBlob: new Blob(["manual"], { type: "image/png" }),
    });
    expect(await repository.refreshArticleCover(item.id, url, image)).toBe(false);
    expect((await repository.getSavedItem(item.id))?.cover.isUserSelected).toBe(true);
    database.close();
  });

  it("persists a sanitized snapshot and preserves a user description", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({
      kind: "article",
      url: "https://example.com/article",
      description: "My own note",
      captureMethod: "active-tab",
    });

    await repository.markCaptureStarted(created.item.id);
    await repository.completeCapture(created.item.id, createCapture({ ogImage: "https://example.com/cover.jpg" }));

    const item = await database.savedItems.get(created.item.id);
    const snapshot = await database.snapshots.where("itemId").equals(created.item.id).first();
    const task = await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "capture").first();
    expect(item).toMatchObject({
      title: "A captured article",
      description: "My own note",
      descriptionSource: "user",
      snapshotStatus: "complete",
      siteIcon: "https://example.com/favicon.ico",
    });
    expect(item?.cover.image).toBe("https://example.com/cover.jpg");
    expect(snapshot).toMatchObject({ cleanText: "Readable article text", completeness: "complete", captureMethod: "active-tab" });
    expect(task).toMatchObject({ status: "complete", attempts: 1 });
    database.close();
  });

  it("uses only an Open Graph image as an automatic cover", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com/work" });

    await repository.completeCapture(created.item.id, createCapture({
      ogImage: undefined,
      favicon: "https://example.com/favicon.ico",
    }));

    const item = await database.savedItems.get(created.item.id);
    expect(item?.cover.image).toBeUndefined();
    expect(item?.cover.blob).toBeUndefined();
    expect(item?.siteIcon).toBe("https://example.com/favicon.ico");
    database.close();
  });

  it("merges a redirect duplicate instead of creating two items", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const canonical = await repository.createSavedItem({ kind: "article", url: "https://example.com/article" });
    const alias = await repository.createSavedItem({ kind: "article", url: "https://example.com/article?edition=feed" });

    const result = await repository.completeCapture(alias.item.id, createCapture({ canonicalUrl: "https://example.com/" }));

    expect(result).toEqual({ itemId: canonical.item.id, mergedDuplicate: true });
    expect(await database.savedItems.count()).toBe(1);
    expect(await database.snapshots.where("itemId").equals(canonical.item.id).count()).toBe(1);
    expect(await database.tasks.where("itemId").equals(alias.item.id).count()).toBe(0);
    database.close();
  });

  it("opens the original homepage and detects duplicates against a legacy saved URL", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const legacy = await repository.createSavedItem({ kind: "website", url: "https://sprrrint.com/?limit=48" });
    await database.savedItems.update(legacy.item.id, { canonicalUrl: legacy.item.originalUrl });

    const result = await repository.createSavedItem({ kind: "website", url: "https://sprrrint.com/" });
    expect(result).toMatchObject({ created: false, item: { id: legacy.item.id } });
    expect(await repository.listLibraryItems()).toMatchObject([
      { id: legacy.item.id, url: "https://sprrrint.com/?limit=48", sourceLabel: "sprrrint.com" },
    ]);
    database.close();
  });

  it.each(["article", "website"] as const)("prevents reclassification when the %s record has a legacy URL", async (legacyKind) => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const article = await repository.createSavedItem({ kind: "article", url: "https://sprrrint.com/" });
    const website = await repository.createSavedItem({ kind: "website", url: "https://sprrrint.com/" });
    await database.savedItems.update((legacyKind === "article" ? article : website).item.id, { canonicalUrl: "https://sprrrint.com/?limit=48" });

    await expect(repository.updateSavedItem(article.item.id, { kind: "website" })).rejects.toThrow("该链接已收藏为所选类型");
    expect((await repository.getSavedItem(article.item.id))?.kind).toBe("article");
    expect(await database.savedItems.count()).toBe(2);
    database.close();
  });

  it("keeps the fragment and trailing slash when opening a collection link", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const url = "https://example.com/guide/?utm_source=test#step-3";
    await repository.createSavedItem({ kind: "article", url });
    expect(await repository.listLibraryItems()).toMatchObject([
      { url, canonicalUrl: "https://example.com/guide", sourceLabel: "example.com/guide" },
    ]);
    database.close();
  });

  it("deduplicates multiple trailing slashes against current and legacy keys", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const url = "https://example.com/guide//?id=42";
    const first = await repository.createSavedItem({ kind: "website", url });
    expect(first.item.canonicalUrl).toBe("https://example.com/guide?id=42");
    expect(await repository.createSavedItem({ kind: "website", url })).toMatchObject({ created: false, item: { id: first.item.id } });
    await database.savedItems.update(first.item.id, { canonicalUrl: "https://example.com/guide/?id=42" });
    expect(await repository.createSavedItem({ kind: "website", url })).toMatchObject({ created: false, item: { id: first.item.id } });
    const article = await repository.createSavedItem({ kind: "article", url });
    await expect(repository.updateSavedItem(article.item.id, { kind: "website" })).rejects.toThrow("该链接已收藏为所选类型");
    database.close();
  });

  it("uses the final X address for presentation and the original short link for navigation", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const url = "https://t.co/short";
    const { item } = await repository.createSavedItem({ kind: "article", url });
    await repository.completeCapture(item.id, createCapture({ url: "https://x.com/designer/status/123" }));
    const [article] = await repository.listLibraryItems();
    expect(article?.url).toBe(url);
    expect(getInspirationPresentation(article!).sourceLabel).toBe("@designer");
    database.close();
  });

  it("keeps content parameters from the final page when the declared canonical omits them", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const { item } = await repository.createSavedItem({ kind: "article", url: "https://example.com/out" });
    await repository.completeCapture(item.id, createCapture({
      url: "https://example.com/read?id=42&ref=feed",
      canonicalUrl: "https://example.com/read",
    }));

    expect(await repository.listLibraryItems()).toMatchObject([
      { id: item.id, url: "https://example.com/out", canonicalUrl: "https://example.com/read?id=42", sourceLabel: "example.com/read?id=42" },
    ]);
    database.close();
  });

  it("marks interrupted capture tasks and items as failed for manual retry", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com/work" });
    await repository.markCaptureStarted(created.item.id);

    await repository.recoverInterruptedCaptureTasks();

    expect(await database.savedItems.get(created.item.id)).toMatchObject({ snapshotStatus: "failed" });
    expect(await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "capture").first()).toMatchObject({
      status: "failed",
      attempts: 1,
      lastError: "浏览器后台在采集期间中断，请在来源页面重试。",
    });
    database.close();
  });

  it("updates editable fields, creates reusable tags, and locks a manual cover", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com/work" });
    const coverBlob = new Blob(["cover"], { type: "image/png" });

    await repository.updateSavedItem(created.item.id, {
      title: "Edited title", description: "Edited description", tags: ["设计", "#前端", "设计"], coverBlob,
    });

    const item = await database.savedItems.get(created.item.id);
    const tags = await database.tags.toArray();
    expect(item).toMatchObject({ title: "Edited title", description: "Edited description", descriptionSource: "user" });
    expect(item?.cover).toMatchObject({ blob: coverBlob, isUserSelected: true });
    expect(tags.map((tag) => [tag.name, tag.usageCount])).toEqual(expect.arrayContaining([["设计", 1], ["前端", 1]]));
    expect(item?.tagIds).toHaveLength(2);
    database.close();
  });

  it("preserves description and tags added since a title-only edit began", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const { item } = await repository.createSavedItem({ kind: "article", url: "https://example.com/article" });
    await repository.completeCapture(item.id, createCapture());
    await repository.updateSavedItem(item.id, { tags: ["Design"] });

    await repository.updateSavedItem(item.id, { title: "My title" });
    expect(await repository.listLibraryItems()).toMatchObject([
      { title: "My title", description: "Page description", descriptionSource: "page", tags: ["Design"] },
    ]);
    database.close();
  });

  it("keeps an icon correction above auto analysis and clears stale analysis when the icon changes", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "follow", url: "https://example.com/profile" });
    await repository.completeCapture(created.item.id, createCapture({ url: "https://example.com/profile", canonicalUrl: "https://example.com/profile" }));
    await repository.setSiteIconAutoBackground(created.item.id, "https://example.com/favicon.ico", "dark");
    await repository.updateSavedItem(created.item.id, {
      title: "Profile", description: "", tags: [], siteIconBackground: "light",
    });
    expect(await database.savedItems.get(created.item.id)).toMatchObject({
      siteIconAutoBackground: "dark", siteIconBackgroundOverride: "light",
    });

    await repository.completeCapture(created.item.id, createCapture({
      url: "https://example.com/profile", canonicalUrl: "https://example.com/profile", favicon: "https://example.com/new-icon.svg",
    }));
    await repository.setSiteIconAutoBackground(created.item.id, "https://example.com/favicon.ico", "dark");
    const afterChange = await database.savedItems.get(created.item.id);
    expect(afterChange?.siteIconAutoBackground).toBeUndefined();
    expect(afterChange?.siteIconBackgroundOverride).toBe("light");

    await repository.updateSavedItem(created.item.id, {
      title: "Profile", description: "", tags: [], siteIconBackground: "auto",
    });
    expect((await database.savedItems.get(created.item.id))?.siteIconBackgroundOverride).toBeUndefined();
    database.close();
  });

  it("adds selected popup tags without duplicating an existing item", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const first = await repository.createSavedItem({ kind: "website", url: "https://example.com/work", tags: ["设计"] });
    const second = await repository.createSavedItem({ kind: "website", url: "https://example.com/work#top", tags: ["前端"] });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(await database.savedItems.count()).toBe(1);
    expect((await repository.listLibraryItems())[0]?.tags).toEqual(expect.arrayContaining(["设计", "前端"]));
    database.close();
  });

  it("merges colliding tag renames and removes deleted items with their snapshot and task", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "article", url: "https://example.com/article" });
    await repository.updateSavedItem(created.item.id, { title: "Article", description: "", tags: ["UI", "界面"] });
    const tags = await repository.listTags();
    const ui = tags.find((tag) => tag.name === "UI")!;
    const interfaceTag = tags.find((tag) => tag.name === "界面")!;
    expect(await repository.renameTag(ui.id, "界面")).toBe("merged");
    await repository.completeCapture(created.item.id, createCapture());

    expect(await database.tags.get(ui.id)).toBeUndefined();
    expect((await database.savedItems.get(created.item.id))?.tagIds).toEqual([interfaceTag.id]);
    expect((await database.tags.get(interfaceTag.id))?.aliases).toContain("UI");
    expect(await repository.renameTag(interfaceTag.id, "界面设计")).toBe("renamed");

    await repository.deleteSavedItem(created.item.id);
    expect(await database.savedItems.count()).toBe(0);
    expect(await database.snapshots.count()).toBe(0);
    expect(await database.tasks.count()).toBe(0);
    database.close();
  });

  it("restores a deleted item with its snapshot and tasks", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "article", url: "https://example.com/undo" });
    await repository.completeCapture(created.item.id, createCapture({ url: "https://example.com/undo", canonicalUrl: "https://example.com/undo" }));

    const deleted = await repository.deleteSavedItem(created.item.id);
    expect(deleted?.item.id).toBe(created.item.id);
    expect(await database.savedItems.get(created.item.id)).toBeUndefined();
    expect(await database.snapshots.where("itemId").equals(created.item.id).count()).toBe(0);

    expect(await repository.restoreSavedItem(deleted!)).toBe(true);
    expect(await database.savedItems.get(created.item.id)).toMatchObject({ canonicalUrl: "https://example.com/undo" });
    expect(await database.snapshots.where("itemId").equals(created.item.id).count()).toBe(1);
    expect(await database.tasks.where("itemId").equals(created.item.id).count()).toBeGreaterThan(0);
    database.close();
  });

  it("applies validated AI output without replacing page descriptions", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "article", url: "https://example.com/article" });
    await repository.completeCapture(created.item.id, createCapture({ description: "Page description" }));
    const task = await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "ai").first();

    await repository.markAiStarted(task!.id);
    await repository.completeAiTask(task!.id, { description: "AI description", tags: ["设计", "前端", "无障碍"] });

    const item = await database.savedItems.get(created.item.id);
    expect(item).toMatchObject({ description: "Page description", descriptionSource: "page", aiStatus: "complete" });
    expect((await repository.listLibraryItems())[0]?.tags).toEqual(expect.arrayContaining(["设计", "前端", "无障碍"]));
    expect(await database.tasks.get(task!.id)).toMatchObject({ status: "complete", attempts: 1 });
    database.close();
  });

  it("never changes tags after the user has edited them", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com", description: "User description", tags: ["人工标签"] });
    const task = await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "ai").first();

    await repository.markAiStarted(task!.id);
    await repository.completeAiTask(task!.id, { description: "AI description", tags: ["设计", "前端", "工具"] });

    const item = await database.savedItems.get(created.item.id);
    expect(item).toMatchObject({ description: "User description", descriptionSource: "user", aiStatus: "complete" });
    expect((await repository.listLibraryItems())[0]?.tags).toEqual(["人工标签"]);
    database.close();
  });

  it("persists AI failure details and makes interrupted work retryable", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com" });
    const task = await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "ai").first();
    await repository.markAiStarted(task!.id);

    await repository.recoverInterruptedAiTasks();

    expect(await database.savedItems.get(created.item.id)).toMatchObject({ aiStatus: "failed" });
    expect(await database.tasks.get(task!.id)).toMatchObject({
      status: "failed",
      attempts: 1,
      lastError: "浏览器后台在 AI 处理期间中断，可重试。",
    });
    database.close();
  });
});
