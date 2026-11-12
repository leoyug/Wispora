import { describe, expect, it } from "vitest";
import { detectCodeLanguage } from "./codeLanguage";

describe("unmarked snapshot code", () => {
  it.each([
    ["JavaScript", 'const near = useInView(ref, { margin: "200px" });\nconst [shown, setShown] = useState(false);'],
    ["JSX", '<span className="inline-grid"><AnimatePresence initial={false}>{role}</AnimatePresence></span>'],
    ["TSX", 'type Props = { title: string };\nconst Card = () => <span className="title" />;'],
    ["TypeScript", 'interface Props { title: string }'],
    ["Swift", "ScrollView { albums }\n    .scrollEdgeEffectStyle(.soft, for: .top)"],
    ["CSS", ".example { color: inherit; }"],
    ["HTML", '<p class="example">Hello</p>'],
    ["JSON", '{"enabled": true}'],
    ["Python", "def greet(name):\n    print(name)"],
    ["SQL", "SELECT name FROM users;"],
    ["Shell", "pnpm install"],
    ["Markdown", "# Heading\n\nAn example."],
    ["", "Create a photorealistic candid photograph of an elderly sailor standing on a small fishing boat."],
  ])("recognizes %s from its syntax", (expected, code) => {
    expect(detectCodeLanguage(code)).toBe(expected);
  });
});
