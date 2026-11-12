export function isXStatusUrl(url: URL) {
  return /^(?:www\.)?(?:x|twitter)\.com$/i.test(url.hostname)
    && /^\/[^/]+\/status\/\d+(?:\/|$)/i.test(url.pathname);
}

export function getXArticleTitle(url: URL, title: string) {
  if (!isXStatusUrl(url)) return undefined;

  const wrappedTitle = title.match(/^(?:\(\d+\)\s*)?(?:X\s*上的\s*.+?[：:]|.+?\s+on\s+X\s*:)\s*(?:“(.+?)”|"(.+?)")\s*\/\s*X$/iu);
  return (wrappedTitle?.[1] ?? wrappedTitle?.[2])?.trim() || undefined;
}

export function resolveXArticleMetadata(url: URL, title: string, documentTitle: string | undefined, description: string) {
  const articleTitle = getXArticleTitle(url, title) ?? (documentTitle ? getXArticleTitle(url, documentTitle) : undefined);
  if (!articleTitle) return { title, description };

  const preview = description.replace(/\s*https?:\/\/t\.co\/\w+\s*$/i, "").trim();
  const previewText = preview.replace(/^[“"]|[”"]$/gu, "").trim();
  return { title: articleTitle, description: previewText === articleTitle ? "" : preview };
}
