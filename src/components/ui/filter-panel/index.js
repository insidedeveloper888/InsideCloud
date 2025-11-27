/**
 * Filter Panel Components
 *
 * Composable filter panel container and section components.
 *
 * @example
 * import { FilterPanel, FilterSection } from '../components/ui/filter-panel';
 * import { CheckboxFilter, DateRangeFilter } from '../components/ui/filters';
 *
 * <FilterPanel isOpen={showFilters} onClose={...} onClearAll={...}>
 *   <FilterSection title="Status" activeCount={2}>
 *     <CheckboxFilter options={statuses} selected={...} onChange={...} />
 *   </FilterSection>
 *   <FilterSection title="Date">
 *     <DateRangeFilter fromDate={...} toDate={...} onChange={...} />
 *   </FilterSection>
 * </FilterPanel>
 */

export { default as FilterPanel } from './FilterPanel';
export { default as FilterSection } from './FilterSection';
