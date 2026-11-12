import { describe, expect, it } from "vitest";
import { readRemoteMetadata } from "./readRemoteMetadata";

describe("readRemoteMetadata", () => {
  it("extracts public metadata and resolves relative asset URLs", () => {
    const result = readRemoteMetadata(`<!doctype html><html><head>
      <title>Fallback title</title>
      <meta content="Remote title" property="og:title">
      <meta name="description" content="A &amp; B">
      <meta property="og:image" content="/cover.png">
      <link href="/canonical" rel="canonical">
      <link rel="shortcut icon" href="assets/icon.svg">
    </head><body><main>Hello world</main></body></html>`, "https://example.com/post");

    expect(result).toMatchObject({
      title: "Remote title",
      description: "A & B",
      canonicalUrl: "https://example.com/canonical",
      ogImage: "https://example.com/cover.png",
      favicon: "https://example.com/assets/icon.svg",
      completeness: "partial",
    });
    expect(result.cleanText).toBe("");
    expect(result.cleanHtml).toBe("");
  });

  it("distinguishes an article header cover from the site sharing image and author avatar", () => {
    const result = readRemoteMetadata(`
      <meta property="og:image" content="/brand.png">
      <article><header>
        <h1>A <em>prompting</em> guide</h1>
        <img src="/avatar.jpg" alt="Author">
      </header>
      <figure><div><img src="../guide.webp" alt="A prompting guide"></div></figure>
      <img src="/example.webp" alt="An example"></article>
    `, "https://example.com/blog/guide/");
    expect(result.articleCover).toBe("https://example.com/blog/guide.webp");
    expect(result.ogImage).toBe("https://example.com/brand.png");
  });

  it("uses safe fallbacks when optional metadata is absent", () => {
    const result = readRemoteMetadata("<html><body></body></html>", "https://example.com/path");
    expect(result.title).toBe("example.com");
    expect(result.favicon).toBe("https://example.com/favicon.ico");
    expect(result.completeness).toBe("partial");
  });

  it("keeps invalid numeric entities instead of throwing", () => {
    const result = readRemoteMetadata(
      "<title>Invalid &#99999999; entity</title>",
      "https://example.com/page",
    );

    expect(result.title).toBe("Invalid &#99999999; entity");
  });
});
