import { createHighlighterCore, type ThemeRegistrationRaw } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const grammarLoaders = {
  css: () => import("shiki/langs/css.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  xml: () => import("shiki/langs/xml.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  shellscript: () => import("shiki/langs/shellscript.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  swift: () => import("shiki/langs/swift.mjs"),
};

type Language = keyof typeof grammarLoaders;

const theme: ThemeRegistrationRaw = {
  name: "wispora-snapshot",
  type: "light",
  fg: "var(--color-text)",
  bg: "var(--color-surface-subtle)",
  settings: [
    { scope: ["comment"], settings: { foreground: "var(--color-muted)" } },
    { scope: ["keyword", "storage", "entity.name.tag", "entity.other.attribute-name.class", "entity.other.attribute-name.id", "markup.heading"], settings: { foreground: "var(--color-accent-ink)" } },
    { scope: ["string", "support.constant.property-value", "markup.inline.raw"], settings: { foreground: "color-mix(in oklab, var(--color-success) 47%, var(--color-ink))" } },
    { scope: ["entity.name.function", "entity.name.type", "support.type", "support.function", "entity.other.attribute-name", "support.type.property-name", "markup.underline.link"], settings: { foreground: "color-mix(in oklab, var(--color-info) 72%, var(--color-ink))" } },
    { scope: ["constant.numeric", "constant.language", "constant.character.escape"], settings: { foreground: "var(--color-accent-ink)" } },
  ],
};

const highlighter = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  themes: [theme],
  langs: [],
});
const loadedLanguages = new Map<Language, Promise<void>>();

function resolveLanguage(label: string): Language | undefined {
  const normalized = label.toLowerCase();
  const name = normalized === "shell" || normalized === "bash" ? "shellscript" : normalized;
  return Object.hasOwn(grammarLoaders, name) ? name as Language : undefined;
}

function loadLanguage(language: Language) {
  const existing = loadedLanguages.get(language);
  if (existing) return existing;
  const pending = Promise.all([highlighter, grammarLoaders[language]()]).then(([instance, grammar]) =>
    instance.loadLanguage(grammar.default),
  );
  loadedLanguages.set(language, pending);
  void pending.catch(() => loadedLanguages.delete(language));
  return pending;
}

export async function highlightSnapshotCode(
  blocks: readonly { language: string; text: string }[],
  elements: readonly HTMLPreElement[],
  signal: AbortSignal,
) {
  let remainingCharacters = 60_000;
  await Promise.all(blocks.map(async ({ language: label, text }, index) => {
    const pre = elements[index];
    const language = resolveLanguage(label);
    if (!pre || !language || !text.trim() || text.length > 20_000 || text.length > remainingCharacters) return;
    remainingCharacters -= text.length;

    try {
      await loadLanguage(language);
      const instance = await highlighter;
      if (signal.aborted || !pre.isConnected) return;

      const lines = instance.codeToTokensBase(text, {
        lang: language,
        theme: "wispora-snapshot",
        tokenizeMaxLineLength: 2_000,
        tokenizeTimeLimit: 20,
      });
      const fragment = document.createDocumentFragment();
      lines.forEach((line, index) => {
        if (index) fragment.append("\n");
        for (const token of line) {
          const span = document.createElement("span");
          span.textContent = token.content;
          if (token.color) span.style.color = token.color;
          fragment.append(span);
        }
      });

      if (fragment.textContent === text) {
        const code = document.createElement("code");
        code.append(fragment);
        pre.replaceChildren(code);
      }
    } catch {
      // Unavailable grammars and parsing failures leave the source text readable.
    }
  }));
}
