/** Shared check geometry and visual state, extracted from the existing tag facet. */
export function CheckboxIndicator({ isSelected = false, isIndeterminate = false }: { isSelected?: boolean; isIndeterminate?: boolean }) {
  return <span data-slot="indicator" className="checkbox-indicator t-check" data-selected={isSelected || undefined} data-indeterminate={isIndeterminate || undefined} aria-hidden="true"><svg viewBox="0 0 10.1668 10.1668" width="12" height="12" aria-hidden="true"><path d={isIndeterminate ? "M2 5.08H8.16" : "M1 5.52L3.92 9.17L9.17 1"} /></svg></span>;
}
