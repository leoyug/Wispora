import { RiArrowDownSLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Checkbox, Dialog, DialogTrigger, FieldInputContext, Input, Popover, SearchField } from "react-aria-components";
import { cn } from "@/src/lib/cn";
import { Button } from "./Button";
import { CheckboxIndicator } from "./CheckboxIndicator";
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";
import { t, tf } from "@/src/i18n/ui";

export interface FacetOption {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface FacetFilterProps {
  label: string;
  icon?: ReactNode;
  options: FacetOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  portalContainer?: Element | null;
  presentation?: "popover" | "inline";
}

export function FacetFilter({ label, icon, options, selectedValues, onChange, searchable = false, searchPlaceholder = "搜索……", portalContainer, presentation = "popover" }: FacetFilterProps) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized ? options.filter((option) => option.label.toLocaleLowerCase().includes(normalized)) : options;
  }, [options, query]);

  const toggleOption = (id: string) => {
    const removing = selectedValues.includes(id);
    onChange(removing ? selectedValues.filter((value) => value !== id) : [...selectedValues, id]);
    // A selected zero-count option remains removable. Move focus before it
    // becomes disabled, so Escape still belongs to the open popover.
    if (removing && options.find((option) => option.id === id)?.disabled) {
      queueMicrotask(() => searchInputRef.current?.focus());
    }
  };

  if (presentation === "inline") return <ToggleGroup label={label} selectionMode="multiple" selectedKeys={selectedValues} onSelectionChange={(keys) => onChange([...keys].map(String))} scrollable>{options.map((option) => <ToggleGroupItem key={option.id} id={option.id} isDisabled={option.disabled && !selectedValues.includes(option.id)}>{option.label}</ToggleGroupItem>)}</ToggleGroup>;

  return (
    <FieldInputContext.Provider value={null}><DialogTrigger>
      <Button variant="secondary" size="sm" className={cn("toolbar-trigger facet-filter-trigger", selectedValues.length > 0 && "is-active")}>
        {icon}
        <span>{label}</span>
        {selectedValues.length ? <span className="facet-filter-count">{selectedValues.length}</span> : null}
        <RiArrowDownSLine className="facet-filter-chevron" size={15} aria-hidden="true" />
      </Button>
      <Popover className="popover-surface facet-filter-popover" placement="bottom start" offset={8} UNSTABLE_portalContainer={portalContainer ?? undefined}>
        <Dialog className="facet-filter-dialog" aria-label={tf("筛选{name}", { name: label })}>
          {searchable ? (
            <SearchField className="facet-filter-search" value={query} onChange={setQuery} aria-label={tf("搜索{name}", { name: label })}>
              <RiSearchLine size={15} aria-hidden="true" />
              <Input ref={searchInputRef} placeholder={t(searchPlaceholder)} />
              {query ? <Button variant="ghost" size="icon" aria-label={tf("清除{name}搜索", { name: label })} onPress={() => setQuery("")}><RiCloseLine size={14} /></Button> : null}
            </SearchField>
          ) : null}
          <div className="facet-filter-options">
            {visibleOptions.map((option) => (
              <Checkbox key={option.id} className="facet-filter-option" isDisabled={option.disabled && !selectedValues.includes(option.id)} isSelected={selectedValues.includes(option.id)} onChange={() => toggleOption(option.id)}>
                <CheckboxIndicator isSelected={selectedValues.includes(option.id)} />
                <span className="facet-option-label">{option.label}</span>
                <span className="facet-option-count">{option.count}</span>
              </Checkbox>
            ))}
            {!visibleOptions.length ? <p className="facet-filter-empty">{t("没有匹配的选项")}</p> : null}
          </div>
          {selectedValues.length ? <button type="button" className="facet-filter-clear" onClick={() => onChange([])}>{t("清除此项筛选")}</button> : null}
        </Dialog>
      </Popover>
    </DialogTrigger></FieldInputContext.Provider>
  );
}
