// Raw sources are only loaded by the dev-only catalog, never by the production app.
import tokenSource from "@/src/design-system/tokens.css?raw";
import themeSource from "@/src/design-system/theme.css?raw";
import { sidebarCssVariables } from "@/src/design-system/sidebar";

function declarations(source: string) {
  return Object.fromEntries([...source.matchAll(/(--[\w-]+):\s*([^;{}]+);/g)].map((match) => [match[1]!, match[2]!.trim()]));
}
const fallback = declarations(tokenSource.split("@supports")[0]!);
const dark = { ...fallback, ...declarations(themeSource.split("@supports")[0]!) };
function reference(value: string, palette: Record<string, string>): string {
  const alias = value.match(/^var\((--[\w-]+)\)$/)?.[1];
  return alias && palette[alias] ? reference(palette[alias]!, palette) : value;
}
export function colorReference(value: string, palette: Record<string, string>) {
  const resolved = reference(value, palette);
  if (resolved.startsWith("#")) return resolved.toUpperCase();
  const rgb = resolved.match(/^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+%))?\)$/);
  if (rgb) return `#${rgb.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("").toUpperCase()}${rgb[4] ? ` · ${rgb[4]}` : ""}`;
  return resolved;
}
export const colorTokens = Object.keys(fallback).filter((token) => token.startsWith("--color-")).map((token) => ({ name: token.slice(8), token, value: colorReference(fallback[token]!, fallback), darkValue: colorReference(dark[token]!, dark) }));
export const foundationTokens: Record<string, string> = { ...fallback, ...sidebarCssVariables };
export const radiusTokens = Object.keys(fallback).filter((token) => token.startsWith("--radius-"));
export const shadowTokens = Object.keys(fallback).filter((token) => token.startsWith("--shadow-"));
export const dimensionTokens = Object.keys(foundationTokens).filter((token) => /^--(?:text|space|size|sidebar-width|aspect)-/.test(token));
export const motionTokens = Object.keys(fallback).filter((token) => /(?:\d+ms$|bezier|^ease|^linear)/.test(reference(fallback[token]!, fallback)));
