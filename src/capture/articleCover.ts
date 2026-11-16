export function matchesArticleCover(heading: string, alt: string, itemprop: string) {
  const normalize = (text: string) => text.trim().replace(/\s+/gu, " ").toLowerCase();
  return itemprop.split(/\s+/u).includes("image") || Boolean(normalize(heading) && normalize(heading) === normalize(alt));
}

export function resolveArticleCoverUrl(value: string | null | undefined, baseUrl: string) {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value, baseUrl);
    return /^https?:$/.test(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
