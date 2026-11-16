import type { LibraryItem } from "@/src/domain/inspiration";
import { getXArticleTitle, isXStatusUrl } from "@/src/capture/xArticleMetadata";

function getPostCopy(text: string) {
  const trimmed = text.trim();
  const boundary = trimmed.search(/[。！？]|[.!?](?=\s|$)/u);
  if (boundary < 0) return { title: trimmed, description: "" };

  const end = boundary + 1;
  const title = trimmed.slice(0, end).trim();
  const description = trimmed.slice(end).trim();
  return description ? { title, description } : { title: trimmed, description: "" };
}

export function getInspirationPresentation(item: LibraryItem) {
  let url: URL;
  try {
    url = new URL(item.canonicalUrl);
  } catch {
    return { title: item.title, description: item.description, sourceLabel: item.sourceLabel };
  }

  if (!isXStatusUrl(url)) {
    return { title: item.title, description: item.description, sourceLabel: item.sourceLabel };
  }

  const profileHandle = url.pathname.split("/")[1] ?? "";
  const articleTitle = item.kind === "article" ? getXArticleTitle(url, item.title) : undefined;
  if (articleTitle) {
    return { title: articleTitle, description: item.description, sourceLabel: `@${profileHandle}` };
  }

  const generatedTitle = item.title.match(/^.+?\s+\(@?([^)]+)\)\s+on\s+X$/i);
  const handle = generatedTitle?.[1]?.trim() || profileHandle;
  const postText = item.description.trim();
  const postCopy = generatedTitle && item.descriptionSource !== "ai" && item.descriptionSource !== "user" && postText ? getPostCopy(postText) : null;

  return {
    title: postCopy?.title || item.title,
    description: postCopy?.description ?? item.description,
    sourceLabel: `@${handle.replace(/^@/, "")}`,
  };
}

const articleSummaryTargetLength = 140;

export function getArticleCardSummary(description: string) {
  const text = description.trim().replace(/\s+/g, " ");
  if (text.length <= articleSummaryTargetLength) return text;

  const sentences = new Intl.Segmenter(undefined, { granularity: "sentence" }).segment(text);
  let summary = "";
  for (const { segment, index } of sentences) {
    const end = index + segment.trimEnd().length;
    if (end > articleSummaryTargetLength) return summary || segment.trim();
    summary = text.slice(0, end);
  }
  return summary;
}
