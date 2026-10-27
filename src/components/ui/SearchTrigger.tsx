import type { Ref } from "react";
import { RiSearchLine } from "@remixicon/react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { KeyboardShortcut } from "./KeyboardShortcut";

interface SearchTriggerProps {
  query: string;
  placeholder: string;
  conditionLabel?: string;
  shortcut: readonly string[];
  "aria-label": string;
  onPress: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export function SearchTrigger({ query, placeholder, conditionLabel, shortcut, onPress, ref, "aria-label": label }: SearchTriggerProps) {
  return (
    <Button ref={ref} variant="ghost" className="library-search search-trigger" onPress={onPress} aria-label={label} aria-haspopup="dialog">
      <RiSearchLine size={20} aria-hidden="true" />
      <span className="search-trigger-copy" data-placeholder={!query || undefined}>{query || placeholder}</span>
      <span className="search-trigger-meta">
        {conditionLabel ? <Badge variant="neutral" size="sm">{conditionLabel}</Badge> : null}
        <KeyboardShortcut keys={shortcut} aria-hidden="true" />
      </span>
    </Button>
  );
}
