import { afterEach, describe, expect, it } from "vitest";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CoverArt } from "@/src/components/inspiration/CoverArt";
import { applyLanguagePreference } from "./language";
import { enUS } from "./messages.en";
import { t, tf } from "./ui";
import { formatUiDate } from "./date";

afterEach(() => applyLanguagePreference("zh-CN"));

describe("interface translations", () => {
  it("switches existing copy immediately and preserves surrounding whitespace", () => {
    expect(t("界面语言")).toBe("界面语言");
    applyLanguagePreference("en-US");
    expect(t("界面语言")).toBe("Interface language");
    expect(t(" 导入收藏 ")).toBe(" Import bookmarks ");
    expect(t("作者")).toBe("Author");
    expect(t("清空搜索")).toBe("Clear search");
  });

  it("interpolates values without translating or reprocessing saved content", () => {
    applyLanguagePreference("en-US");
    expect(tf("移除标签 {name}", { name: "界面语言 {count}" })).toBe("Remove tag 界面语言 {count}");
    expect(t("我的原始收藏内容")).toBe("我的原始收藏内容");
    expect(t("OpenAI")).toBe("OpenAI");
  });

  it("formats dates in the selected language", () => {
    const date = new Date(2020, 0, 2).getTime();
    applyLanguagePreference("en-US");
    expect(formatUiDate(date)).toBe("Jan 2, 2020");
    expect(formatUiDate(Date.now())).toBe("Just now");
    applyLanguagePreference("zh-CN");
    expect(formatUiDate(date)).toContain("2020年");
  });

  it("translates fixed cover placeholders while preserving titles and custom cover text", () => {
    applyLanguagePreference("en-US");
    const item = { title: "我的网站", cover: { label: "网站", background: "", foreground: "", motif: "type" as const } };
    const markup = renderToStaticMarkup(createElement(CoverArt, { item }));
    expect(markup).toContain("<span>Website</span>");
    expect(markup).toContain("Cover placeholder for 我的网站");
    expect(item.cover.label).toBe("网站");
    item.cover.label = "我的封面文字";
    expect(renderToStaticMarkup(createElement(CoverArt, { item }))).toContain("<span>我的封面文字</span>");
  });

  it("keeps interpolation parameters intact in every translation", () => {
    const parameters = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const [source, translation] of Object.entries(enUS)) {
      expect(translation.trim(), source).not.toBe("");
      expect(parameters(translation), source).toEqual(parameters(source));
    }
  });

  it("provides English copy for literal translation calls in production UI", () => {
    const missing = new Set<string>();
    const sources = import.meta.glob<string>(["../components/**/*.tsx", "../features/**/*.tsx", "../../entrypoints/**/*.tsx", "!../features/design-system/**"], { query: "?raw", import: "default", eager: true });
    for (const [path, source] of Object.entries(sources)) {
      const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["t", "tf"].includes(node.expression.text)) {
          const argument = node.arguments[0];
          if (argument && ts.isStringLiteral(argument) && /\p{Script=Han}/u.test(argument.text) && !enUS[argument.text.trim()]) {
            missing.add(`${path}: ${argument.text}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
    expect([...missing]).toEqual([]);
  });
});
