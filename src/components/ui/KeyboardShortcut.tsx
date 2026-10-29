import type { ComponentProps } from "react";
import { Keyboard } from "react-aria-components";
import { cn } from "@/src/lib/cn";

// Intent UI registry source (2026-10-27): https://intentui.com/r/keyboard.json
// Keep the semantic Keyboard primitive; use Wispora's shared keycap styling.
interface KeyboardShortcutProps extends Omit<ComponentProps<typeof Keyboard>, "children"> {
  keys: readonly string[];
}

export function KeyboardShortcut({ keys, className, ...props }: KeyboardShortcutProps) {
  return (
    <Keyboard {...props} data-slot="keyboard" className={cn("keyboard-shortcut", className)}>
      {keys.map((key, index) => <span key={`${key}-${index}`}>{key}</span>)}
    </Keyboard>
  );
}
