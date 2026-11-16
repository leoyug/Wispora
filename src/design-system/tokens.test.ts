import { describe, expect, it } from "vitest";
import tokens from "./tokens.css?raw";
import theme from "./theme.css?raw";
import { colorTokens } from "@/src/features/design-system/tokenCatalog";

// Validate the actual stylesheet boundary: missing media radii and stale color
// catalogs silently invalidate CSS rather than producing build errors.
describe("design system token integrity", () => {
  it("defines every stylesheet variable or supplies a fallback/runtime value", () => {
    const sheets = import.meta.glob<string>(["./*.css", "../features/**/*.css"], { query: "?raw", import: "default", eager: true });
    const source = Object.values(sheets).join("\n");
    const definitions = new Set([...source.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
    const runtime = new Set(["--available-height", "--trigger-anchor-point", "--trigger-width", "--sidebar-width", "--sidebar-width-default", "--sidebar-width-min", "--sidebar-width-max", "--sidebar-width-collapsed", "--cover-background", "--saved-view-label-duration", "--saved-view-label-travel", "--spark-x", "--spark-y"]);
    const missing = [...source.matchAll(/var\((--[\w-]+)\s*([,)])/g)].filter((match) => match[2] !== "," && !definitions.has(match[1]) && !runtime.has(match[1]!)).map((match) => match[1]);
    expect([...new Set(missing)]).toEqual([]);
  });

  it("supplies canonical P3 or a semantic alias for each fallback color", () => {
    for (const source of [tokens, theme]) {
      const [fallback, canonical] = source.split("@supports");
      for (const match of fallback!.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)) {
        if (match[2]!.startsWith("var(")) continue;
        expect(canonical, match[1]).toMatch(new RegExp(`${match[1]}: (?:color\\(display-p3|var\\()`));
      }
    }
  });

  it("shows every color with uppercase six-digit references in both themes", () => {
    const names = [...tokens.split("@supports")[0]!.matchAll(/(--color-[\w-]+):/g)].map((match) => match[1]);
    expect(colorTokens.map((token) => token.token).sort()).toEqual(names.sort());
    for (const token of colorTokens) {
      expect(token.value, token.token).toMatch(/^#[0-9A-F]{6}(?: · [\d.]+%)?$/);
      expect(token.darkValue, token.token).toMatch(/^#[0-9A-F]{6}(?: · [\d.]+%)?$/);
    }
  });
});
