import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { Button } from "./Button";
import { t } from "@/src/i18n/ui";
import { forwardRef, useRef, type RefObject, type ComponentProps } from "react";
import { Input as AriaInput, SearchField as AriaSearchField } from "react-aria-components";

// Intent UI search-field anatomy, adapted to Wispora's semantic CSS.
// https://intentui.com/docs/components/forms/search-field
export function SearchField(props: ComponentProps<typeof AriaSearchField>) {
  return <AriaSearchField data-slot="search-field" {...props} />;
}

export const SearchInput = forwardRef<HTMLInputElement, ComponentProps<typeof AriaInput>>((props, ref) => <AriaInput ref={ref} data-slot="input" {...props} />);
SearchInput.displayName = "SearchInput";

/** Compact search used by settings, history and filter popovers. */
export function CompactSearchField({ value, onChange, placeholder, clearLabel, inputRef, autoFocus, className = "tag-search-field", iconSize = 16, ...props }: Omit<ComponentProps<typeof AriaSearchField>, "children" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  iconSize?: number;
}) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef ?? localInputRef;
  return <SearchField {...props} className={className} value={value} onChange={onChange}>
    <RiSearchLine size={iconSize} aria-hidden="true" />
    <SearchInput ref={resolvedInputRef} autoFocus={autoFocus} placeholder={placeholder} />
    {value ? <Button size="icon" variant="ghost" aria-label={clearLabel ?? t("清空搜索")} onPress={() => { onChange(""); resolvedInputRef.current?.focus(); }}><RiCloseLine size={iconSize} aria-hidden="true" /></Button> : null}
  </SearchField>;
}
