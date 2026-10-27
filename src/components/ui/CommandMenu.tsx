import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { createContext, useContext, useEffect, useRef, type ComponentProps, type KeyboardEventHandler, type ReactNode, type Ref } from "react";
import { Autocomplete, AutocompleteStateContext, Menu as AriaMenu, MenuItem as AriaMenuItem, MenuStateContext, Text, type AutocompleteProps, type MenuProps } from "react-aria-components";
import { CollectionRendererContext, DefaultCollectionRenderer, type CollectionRenderer } from "react-aria-components/CollectionBuilder";
import { Button } from "./Button";
import { Dialog, Modal, ModalOverlay } from "./Modal";
import { SearchField, SearchInput } from "./SearchField";
import { cn } from "@/src/lib/cn";

// Intent UI registry source (2026-10-27): https://intentui.com/r/command-menu.json
// Preserve Modal → Dialog → Autocomplete → SearchField/Menu, controlled state,
// virtual focus and label/description slots. External search supplies filtered items.
interface CommandMenuProps extends Pick<AutocompleteProps, "inputValue" | "onInputChange" | "disableAutoFocusFirst"> {
  children: ReactNode;
  isOpen: boolean;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  "aria-label": string;
  onKeyDownCapture?: KeyboardEventHandler<HTMLElement>;
}

const CommandContext = createContext({ isPending: false });

export function CommandMenu({ children, isOpen, isPending = false, onOpenChange, "aria-label": label, onKeyDownCapture, ...props }: CommandMenuProps) {
  return (
    <CommandContext.Provider value={{ isPending }}>
      <ModalOverlay className="detail-overlay command-menu-overlay" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
        <Modal className="command-menu-modal">
          <Dialog className="command-menu-dialog" aria-label={label}>
            <div className="command-menu-content" onKeyDownCapture={onKeyDownCapture}><Autocomplete {...props}>{children}</Autocomplete></div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </CommandContext.Provider>
  );
}

interface CommandMenuSearchProps {
  label: string;
  placeholder: string;
  clearLabel: string;
  closeLabel: string;
  onClear: () => void;
  onClose: () => void;
  inputRef?: Ref<HTMLInputElement>;
  onCompositionStart?: ComponentProps<typeof SearchInput>["onCompositionStart"];
  onCompositionEnd?: ComponentProps<typeof SearchInput>["onCompositionEnd"];
}

export function CommandMenuSearch({ label, placeholder, clearLabel, closeLabel, onClear, onClose, inputRef, onCompositionStart, onCompositionEnd }: CommandMenuSearchProps) {
  const state = useContext(AutocompleteStateContext);
  return (
    <SearchField className="command-menu-search" aria-label={label} autoFocus>
      <RiSearchLine size={22} aria-hidden="true" />
      <SearchInput ref={inputRef} placeholder={placeholder} autoComplete="off" spellCheck={false} onCompositionStart={onCompositionStart} onCompositionEnd={onCompositionEnd} />
      {state?.inputValue ? <Button variant="ghost" size="icon" aria-label={clearLabel} onPress={onClear}><RiCloseLine size={17} /></Button> : null}
      <Button variant="ghost" size="sm" className="command-menu-escape" aria-label={closeLabel} onPress={onClose}><kbd>Esc</kbd></Button>
    </SearchField>
  );
}

interface CommandFocus {
  preferredFocusId?: string | null;
  focusRequest?: string;
  onActiveChange?: (id: string) => void;
}
const CommandFocusContext = createContext<CommandFocus>({});

// Keep focus restoration in the registry's collection renderer, rather than in
// collection items, whose render lifecycles can restart during keyboard navigation.
const renderer: CollectionRenderer = {
  CollectionRoot(props) {
    const state = useContext(MenuStateContext);
    const { isPending } = useContext(CommandContext);
    const { preferredFocusId, focusRequest = "initial", onActiveChange } = useContext(CommandFocusContext);
    const restored = useRef<string | null>(null);
    useEffect(() => {
      if (state && !isPending && restored.current !== focusRequest && state.collection.size) {
        const key = preferredFocusId && state.collection.getItem(preferredFocusId) ? preferredFocusId : state.collection.getFirstKey();
        // Wait for Autocomplete to attach its virtual-focus listener to the list.
        const frame = requestAnimationFrame(() => {
          restored.current = focusRequest;
          state.selectionManager.setFocused(true);
          state.selectionManager.setFocusedKey(key);
        });
        return () => cancelAnimationFrame(frame);
      }
    }, [state, isPending, preferredFocusId, focusRequest]);
    const focusedKey = state?.selectionManager.focusedKey;
    useEffect(() => {
      if (focusedKey != null) onActiveChange?.(String(focusedKey));
    }, [focusedKey, onActiveChange]);
    return <DefaultCollectionRenderer.CollectionRoot {...props} />;
  },
  CollectionBranch: DefaultCollectionRenderer.CollectionBranch,
};

export function CommandMenuList<T extends object>({ className, preferredFocusId, focusRequest, onActiveChange, ...props }: MenuProps<T> & CommandFocus & { ref?: Ref<HTMLDivElement> }) {
  return <CommandFocusContext.Provider value={{ preferredFocusId, focusRequest, onActiveChange }}><CollectionRendererContext.Provider value={renderer}><AriaMenu className={cn("command-menu-list", typeof className === "string" && className)} shouldCloseOnSelect={false} {...props} /></CollectionRendererContext.Provider></CommandFocusContext.Provider>;
}

export function CommandMenuItem({ className, ...props }: ComponentProps<typeof AriaMenuItem>) {
  const { isPending } = useContext(CommandContext);
  return <AriaMenuItem {...props} isDisabled={isPending || props.isDisabled} className={cn("command-menu-item", typeof className === "string" && className)} />;
}

export function CommandMenuLabel(props: ComponentProps<typeof Text>) {
  return <Text {...props} slot="label" className={cn("command-menu-label", props.className)} />;
}

export function CommandMenuDescription(props: ComponentProps<typeof Text>) {
  return <Text {...props} slot="description" className={cn("command-menu-description", props.className)} />;
}

export function CommandMenuFooter(props: ComponentProps<"footer">) {
  return <footer {...props} className={cn("command-menu-footer", props.className)} />;
}
