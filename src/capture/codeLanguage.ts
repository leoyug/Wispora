const languageLabels: Record<string, string> = {
  css: "CSS", html: "HTML", xml: "XML", js: "JavaScript", javascript: "JavaScript",
  jsx: "JSX", ts: "TypeScript", typescript: "TypeScript", tsx: "TSX", json: "JSON",
  md: "Markdown", markdown: "Markdown", py: "Python", python: "Python",
  sh: "Shell", bash: "Bash", shell: "Shell", yaml: "YAML", yml: "YAML", sql: "SQL", swift: "Swift",
};

export function detectCodeLanguage(source: string) {
  const text = source.trim().slice(0, 8_000);
  if (!text) return "";

  if (/^[{\[]/.test(text)) {
    try {
      const value: unknown = JSON.parse(text);
      if (value && typeof value === "object") return "JSON";
    } catch {
      // JavaScript object literals also start with a brace.
    }
  }

  const typed = /^\s*(?:export\s+)?(?:interface\s+[A-Z_$][\w$]*\s*(?:extends\s+[^\n{]+)?\{|type\s+[A-Z_$][\w$]*\s*=)/m.test(text)
    || /^\s*(?:const|let|var)\s+[\w$]+\s*:\s*[\w$]+(?:<[^\n>]+>)?(?:\[\])?\s*=/m.test(text);
  const hasTag = /<[A-Za-z][\w.:-]*(?=[\s/>])[^<>\n]*\/?>/.test(text);
  const jsx = hasTag && (/\bclassName\s*=|<[A-Z][\w.]*(?=[\s/>])|<[a-z][\w-]*\.[\w.]+\b|\w+\s*=\s*\{|<\/>/.test(text)
    || /(?:=>|\breturn)\s*\(?\s*</.test(text));
  if (jsx) return typed ? "TSX" : "JSX";
  if (typed) return "TypeScript";

  if (/^<\?xml\b/.test(text)) return "XML";
  if (/^<!doctype\s+html\b/i.test(text) || (hasTag && /^</.test(text) && /<\/[a-z][\w:-]*>|<[^>]+\/>/i.test(text))) return "HTML";

  if (/^\s*import\s+(?:SwiftUI|Foundation|UIKit|AppKit)\b/m.test(text)
    || /\bvar\s+body\s*:\s*some\s+View\s*\{/.test(text)
    || (/\b(?:ScrollView|List|VStack|HStack|ZStack|NavigationStack)\b[^\n]*\{/.test(text)
      && /\.\w+\(\s*\.\w+\s*,\s*for:\s*\.\w+/.test(text))) return "Swift";

  if (/^\s*(?:async\s+)?def\s+[a-zA-Z_]\w*\([^\n]*\)\s*(?:->[^\n:]+)?\s*:/m.test(text)
    || /^\s*from\s+[\w.]+\s+import\s+\w+/m.test(text)) return "Python";

  if (/^\s*(?:SELECT\b[\s\S]+?\bFROM\s+\w|INSERT\s+INTO\s+\w|CREATE\s+TABLE\s+\w|UPDATE\s+\w+\s+SET\s+)/i.test(text)) return "SQL";
  if (/^#![^\n]*\b(?:ba|z|da|k)?sh\b/.test(text)
    || /^(?:\$\s+)?(?:npm|pnpm|yarn|git|curl|docker|brew)\s+[\w-]+(?:\s+[^\n]+)?$/.test(text) && !text.includes(";")) return "Shell";

  if (/^\s*(?:export\s+)?(?:const|let|var)\s+(?:[\w$]+|\[[^\n]+?\]|\{[^\n]+?\})\s*=\s*\S/m.test(text)
    || /^\s*(?:export\s+)?(?:async\s+)?function\s+[\w$]+\s*\([^\n]*\)\s*\{/m.test(text)
    || /(?:\([^\n]*\)|\b[\w$]+)\s*=>\s*\S/.test(text)) return "JavaScript";

  if (/(?:^|\n)\s*(?:[@.#:]?[\w*-]+)[^{}\n]*\{\s*(?:--)?[a-z][\w-]*\s*:\s*[^{};\n]+[;}]/i.test(text)) return "CSS";

  if (/^ {0,3}(?:#{1,6}\s+\S|\x60{3,}\w+\s*$|~~~\w+\s*$)/m.test(text)
    || /\[[^\n\]]+\]\(https?:\/\/[^\s)]+\)/.test(text)) return "Markdown";
  return "";
}

export function getCodeLanguage(pre: HTMLPreElement) {
  const code = pre.querySelector("code");
  for (const element of [code, pre, pre.parentElement]) {
    if (!element) continue;
    const classLanguage = [...element.classList].find((name) => /^(language|lang)-/i.test(name));
    const language = (element.getAttribute("data-language") || element.getAttribute("data-lang")
      || classLanguage?.replace(/^(language|lang)-/i, ""))?.trim();
    if (!language || !/^[a-z0-9+#._-]{1,30}$/i.test(language)) continue;
    if (/^(text|plaintext|plain|none)$/i.test(language)) return "";
    return Object.hasOwn(languageLabels, language.toLowerCase()) ? languageLabels[language.toLowerCase()]! : language;
  }
  for (const filename of [code?.getAttribute("data-filename"), pre.getAttribute("data-filename"), pre.previousElementSibling?.textContent]) {
    const extension = filename?.trim().match(/^[\w.-]+\.([a-z][\w]*)$/i)?.[1]?.toLowerCase();
    if (extension && Object.hasOwn(languageLabels, extension)) return languageLabels[extension]!;
  }

  if (pre.querySelector("br")) {
    const copy = pre.cloneNode(true) as HTMLPreElement;
    for (const br of copy.querySelectorAll("br")) br.replaceWith("\n");
    return detectCodeLanguage(copy.textContent);
  }
  return detectCodeLanguage(pre.textContent);
}
