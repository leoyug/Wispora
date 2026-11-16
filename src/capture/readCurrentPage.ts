import DOMPurify from "dompurify";
import { Readability } from "@mozilla/readability";
import { matchesArticleCover, resolveArticleCoverUrl } from "./articleCover";
import { getCodeLanguage } from "./codeLanguage";
import type { PageCapture } from "./types";

const MAX_HTML_LENGTH = 2_000_000;
const MAX_TEXT_LENGTH = 1_000_000;

function metaContent(...selectors: string[]) {
  for (const selector of selectors) {
    const content = document.querySelector<HTMLMetaElement>(selector)?.content.trim();
    if (content) return content;
  }
  return "";
}

function absoluteUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    return new URL(value, location.href).href;
  } catch {
    return undefined;
  }
}

function compact(value: string, limit: number) {
  const normalized = value.replace(/\u0000/g, "").trim();
  return { value: normalized.slice(0, limit), truncated: normalized.length > limit };
}

function readArticleCover() {
  for (const header of document.querySelectorAll("article header")) {
    const heading = header.querySelector("h1")?.textContent ?? "";
    const followingFigure = header.nextElementSibling;
    const images = [...header.querySelectorAll("img")];
    if (followingFigure?.matches("figure")) images.push(...followingFigure.querySelectorAll("img"));
    for (const image of images) {
      if (!matchesArticleCover(heading, image.alt, image.getAttribute("itemprop") ?? "")) continue;
      const url = resolveArticleCoverUrl(image.currentSrc || image.getAttribute("src"), location.href);
      if (url) return url;
    }
  }
  return undefined;
}

/** Runs only after an explicit user action through scripting.executeScript. */
export function readCurrentPage(): PageCapture {
  const clonedDocument = document.cloneNode(true) as Document;
  // Readability removes source classes, so carry code language through as data.
  for (const pre of clonedDocument.querySelectorAll("pre")) {
    const language = getCodeLanguage(pre);
    if (language) pre.setAttribute("data-language", language);
  }
  const article = new Readability(clonedDocument).parse();
  const fallbackRoot = document.querySelector("main, article, [role='main']") ?? document.body;
  const sourceHtml = article?.content || fallbackRoot?.innerHTML || "";
  const sourceText = article?.textContent || fallbackRoot?.textContent || "";
  const cleanHtmlResult = compact(DOMPurify.sanitize(sourceHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "form", "input", "button", "iframe", "object", "embed"],
    FORBID_ATTR: ["style", "srcdoc"],
  }), MAX_HTML_LENGTH);
  const cleanTextResult = compact(sourceText.replace(/\s+/g, " "), MAX_TEXT_LENGTH);
  const hasReadableArticle = Boolean(article?.content && cleanTextResult.value.length >= 200);
  const hasFallback = cleanTextResult.value.length > 0;
  const completeness = !hasFallback
    ? "failed"
    : hasReadableArticle && !cleanHtmlResult.truncated && !cleanTextResult.truncated
      ? "complete"
      : "partial";

  const canonicalUrl = absoluteUrl(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href);
  const favicon = absoluteUrl(document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href) ?? absoluteUrl("/favicon.ico");

  const documentTitle = document.title.trim();
  const title = metaContent('meta[property="og:title"]', 'meta[name="twitter:title"]') || documentTitle;
  const description = metaContent('meta[property="og:description"]', 'meta[name="description"]', 'meta[name="twitter:description"]');

  return {
    title,
    documentTitle,
    description,
    url: location.href,
    baseUrl: /^https?:\/\//i.test(document.baseURI) ? document.baseURI : undefined,
    canonicalUrl,
    siteName: metaContent('meta[property="og:site_name"]') || undefined,
    byline: article?.byline || undefined,
    excerpt: article?.excerpt || undefined,
    cleanText: cleanTextResult.value,
    cleanHtml: cleanHtmlResult.value,
    completeness,
    articleCover: readArticleCover(),
    ogImage: absoluteUrl(metaContent('meta[property="og:image"]', 'meta[name="twitter:image"]')),
    favicon,
  };
}
