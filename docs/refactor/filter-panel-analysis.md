# FilterPanel Components Analysis

**Date:** 2025-11-27
**Auditor:** Architecture Overseer Agent
**Total Components:** 4
**Total Lines:** 1,706

---

## 1. Feature Comparison Matrix

| Feature | Inventory | Contact | Sales | Project |
|---------|-----------|---------|-------|---------|
| **Lines of code** | 1,008 | 353 | 223 | 122 |
| **Mobile drawer** | ✅ Right-side | ✅ Right-side | ✅ Right-side | ❌ Left-side fixed |
| **Desktop sidebar** | ✅ Collapsible | ✅ Fixed 256px | ✅ Fixed 256px | ✅ Fixed 320px |
| **Overlay backdrop** | ✅ | ✅ | ✅ | ❌ |
| **Collapsible sections** | ✅ | ✅ | ✅ | ❌ |
| **Clear all button** | ✅ In header | ✅ In header | ✅ In header | ✅ In footer |
| **Apply button** | ❌ | ❌ | ❌ | ❌ |
| **Active filter detection** | ✅ | ✅ | ✅ | ❌ |
| **Search within filters** | ✅ (5 sections) | ❌ | ❌ | ❌ |
| **Body scroll lock** | ✅ | ✅ | ✅ | ❌ |
| **Context-aware sections** | ✅ (by tab) | ❌ | ❌ | ❌ |
| **Close button (X)** | ✅ Always | ✅ Mobile only | ✅ Mobile only | ✅ Always |
| **CSS file** | ❌ (Tailwind) | ✅ (100 lines) | ❌ (Tailwind) | ❌ (Tailwind) |

---

## 2. Filter Types Inventory

### 2.1 Inventory FilterPanel (1,008 lines)

**Context-aware by tab:** `currentTab` prop controls which sections show

| Filter Type | Section Name | Implementation | Lines | Tab(s) |
|-------------|--------------|----------------|-------|--------|
| Radio-like checkbox | Item Type | Custom exclusive checkbox | 48 | products |
| Searchable checkbox list | Category | Checkbox + search input | 50 | overview, products |
| Searchable checkbox list | Location/Warehouse | Checkbox + search input | 50 | overview, movements, purchase-orders, delivery-orders |
| Searchable checkbox list | Supplier | Checkbox + search input | 50 | purchase-orders |
| Checkbox list | Stock Status | Static options array | 28 | overview |
| Number range | Quantity Range | Min/max inputs | 30 | overview |
| Checkbox list | Movement Type | Static options (IN/OUT) | 28 | movements |
| Date range | Movement Date | From/to date inputs | 22 | movements |
| Searchable checkbox list | Operator | Checkbox + search | 45 | movements |
| Checkbox list | PO Status | Static options | 28 | purchase-orders |
| Date range | PO Order Date | From/to date inputs | 22 | purchase-orders |
| Date range | PO Expected Delivery | From/to date inputs | 22 | purchase-orders |
| Searchable checkbox list | Managed By | Checkbox + search | 45 | purchase-orders |
| Checkbox list | DO Status | Static options | 28 | delivery-orders |
| Date range | DO Order Date | From/to date inputs | 22 | delivery-orders |
| Searchable checkbox list | Customer | Checkbox + search | 50 | delivery-orders |
| Searchable checkbox list | Created By | Checkbox + search | 45 | delivery-orders |
| Checkbox list | State | Dynamic options | 25 | suppliers |

**Total unique filter patterns:** 4 (Checkbox list, Searchable checkbox list, Date range, Number range)

**Props:**
```jsx
{
  filters: object,           // Current filter state
  onFiltersChange: function, // Callback (filters) => void
  categories: array,         // Checkbox options
  locations: array,          // { id, name }
  suppliers: array,          // { id, name/company_name/first_name/last_name }
  products: array,
  users: array,              // { id, display_name, email }
  customers: array,          // { id, company_name, first_name, last_name }
  states: array,             // strings
  isOpen: boolean,           // Controls visibility
  onClose: function,         // Close handler
  currentTab: string,        // 'overview' | 'products' | 'movements' | 'purchase-orders' | 'delivery-orders' | 'suppliers'
}
```

**Filter state shape:**
```javascript
{
  categories: [],
  locations: [],
  suppliers: [],
  stockStatuses: [],
  showInactive: false,
  minQuantity: null,
  maxQuantity: null,
  movementTypes: [],
  movementDateFrom: '',
  movementDateTo: '',
  users: [],
  products: [],
  poStatuses: [],
  managedBy: [],
  poOrderDateFrom: '',
  poOrderDateTo: '',
  poExpectedDeliveryFrom: '',
  poExpectedDeliveryTo: '',
  doStatuses: [],
  customers: [],
  createdBy: [],
  doOrderDateFrom: '',
  doOrderDateTo: '',
  states: [],
  itemType: null,
}
```

---

### 2.2 Contact FilterPanel (353 lines)

| Filter Type | Section Name | Implementation | Lines | Notes |
|-------------|--------------|----------------|-------|-------|
| Checkbox list | Contact Type | Static CONTACT_TYPES array | 28 | customer/supplier/coi/internal |
| Checkbox list with color dot | Stage | Dynamic from props | 35 | Shows stage.color dot |
| Checkbox list | Traffic Source (Channel) | Dynamic from props | 28 | - |
| Checkbox list with emoji | Customer Rating | Dynamic ranges based on maxRatingScale | 38 | ⭐ emoji, dynamic Low/Med/High ranges |
| Checkbox list with TagBadge | Tags | Dynamic from props | 25 | Uses TagBadge component |

**Total unique filter patterns:** 3 (Checkbox list, Checkbox with color, Checkbox with custom component)

**Props:**
```jsx
{
  filters: object,
  onFiltersChange: function,
  stages: array,          // { id, name, color }
  channels: array,        // { id, name }
  tags: array,            // passed to TagBadge
  maxRatingScale: number, // 3-10, affects rating range labels
  isOpen: boolean,
  onClose: function,
}
```

**Filter state shape:**
```javascript
{
  contactTypes: [],
  stages: [],
  channels: [],
  tags: [],
  ratings: [],  // 'low' | 'medium' | 'high'
}
```

**Unique features:**
- Dynamic rating ranges based on `maxRatingScale` (3-10 stars)
- Uses external `TagBadge` component for rendering tags
- Has associated CSS file (FilterPanel.css) but doesn't import it in the component

---

### 2.3 Sales FilterPanel (223 lines)

| Filter Type | Section Name | Implementation | Lines | Notes |
|-------------|--------------|----------------|-------|-------|
| Checkbox list | Status | Uses useSalesOrderStatuses hook | 28 | Dynamic from database |
| Checkbox list | Customer | Dynamic from props | 30 | Max height 192px with scroll |
| Checkbox list | Sales Person | Dynamic from props | 28 | Max height 192px with scroll |

**Total unique filter patterns:** 1 (Checkbox list)

**Props:**
```jsx
{
  filters: object,
  onFiltersChange: function,
  customers: array,       // { id, company_name, first_name, last_name }
  salesPersons: array,    // { id, display_name }
  organizationSlug: string, // For status hook
  isOpen: boolean,
  onClose: function,
}
```

**Filter state shape:**
```javascript
{
  statuses: [],
  customers: [],
  salesPersons: [],
}
```

**Unique features:**
- Uses `useSalesOrderStatuses` hook for dynamic status options
- Status options come from database, not hardcoded

---

### 2.4 Project FilterPanel (122 lines)

| Filter Type | Section Name | Implementation | Lines | Notes |
|-------------|--------------|----------------|-------|-------|
| Checkbox list | Project Status | Hardcoded array | 20 | active/pending/completed/cancelled |
| Checkbox list | Template Type | Dynamic from props | 20 | template.id, template.name |
| Date range (mock) | Due Date | From/to inputs | 15 | **NOT FUNCTIONAL** - no state binding |

**Total unique filter patterns:** 2 (Checkbox list, Date range - non-functional)

**Props:**
```jsx
{
  isOpen: boolean,
  onClose: function,
  filters: object,
  onFilterChange: function, // Different signature: (type, value) => void
  templates: array,         // { id, name }
}
```

**Filter state shape:**
```javascript
{
  status: [],
  templates: [],
}
```

**Unique features:**
- Different `onFilterChange` API: `(type, value)` instead of `(filters)`
- "Reset All Filters" button in footer
- Date inputs are not connected to state (mock/placeholder)
- Uses icons in section headers (Tag, Layers, Calendar)
- Fixed left-side sidebar (not right-side drawer)
- No mobile responsiveness

---

## 3. Common Patterns

### 3.1 Shared UI Elements

| Element | Inventory | Contact | Sales | Project |
|---------|-----------|---------|-------|---------|
| Section header button | `w-full px-4 py-3 flex...` | Same | Same | Different (h3 + label) |
| Checkbox styling | `w-4 h-4 text-blue-600...` | Same | Same | Same |
| Section expand/collapse | ChevronDown/ChevronRight | Same | Same | N/A |
| Clear all button | `text-blue-600 text-sm` | Same | Same | Full-width button in footer |
| Close X button | lucide X icon | Same | Same | Same |
| Backdrop overlay | `fixed inset-0 bg-black...` | Same | Same | None |

### 3.2 Shared Logic

| Logic | Inventory | Contact | Sales | Project |
|-------|-----------|---------|-------|---------|
| Toggle section expand | `setExpandedSections()` | Same | Same | N/A |
| Toggle filter selection | Array push/filter | Same | Same | Similar (different callback) |
| Clear all filters | Reset to empty arrays | Same | Same | `onFilterChange('clear', null)` |
| Detect active filters | Check all arrays `.length > 0` | Same | Same | N/A |
| Body scroll lock | `document.body.style.overflow` | Same | Same | N/A |
| Click outside close | Overlay onClick | Same | Same | N/A |

### 3.3 Component Structure (All Panels)

```
┌─────────────────────────────────────┐
│ Header                              │
│  ├── Title "Filters"                │
│  ├── Clear all (if active filters)  │
│  └── Close button (X)               │
├─────────────────────────────────────┤
│ Scrollable Content                  │
│  ├── Section 1 (collapsible)        │
│  │    ├── Section header            │
│  │    └── Filter options            │
│  ├── Section 2...                   │
│  └── Section N...                   │
├─────────────────────────────────────┤
│ Footer (Project only)               │
│  └── Reset All button               │
└─────────────────────────────────────┘
```

---

## 4. Unique Features Per Panel

### Inventory (most complex)
- **Tab-specific filter sections** via `currentTab` prop
- **Search within checkbox lists** (categories, locations, suppliers, users, customers)
- **Number range filter** (min/max quantity)
- **5 different date range filters**
- **18 total filter sections** across 6 tabs
- **Width transitions** on desktop (w-64 → w-0)

### Contact
- **Dynamic rating ranges** based on `maxRatingScale` prop
- **Stage color dots** in checkbox labels
- **TagBadge component** for tag display
- **Legacy CSS file** (100 lines, unused)

### Sales
- **Dynamic statuses from hook** (`useSalesOrderStatuses`)
- **Simplest implementation** - only 3 filter types
- **Database-driven status options**

### Project
- **Left-side positioning** (all others are right-side)
- **No mobile drawer** (fixed sidebar only)
- **Icons in section headers**
- **Footer action button** instead of header clear
- **Mock date range** (non-functional)
- **Different API signature** (`onFilterChange(type, value)` vs `onFiltersChange(filters)`)

---

## 5. Styling Analysis

| Aspect | Inventory | Contact | Sales | Project |
|--------|-----------|---------|-------|---------|
| Width (mobile) | 85%, max-sm | 85%, max-sm | 85%, max-sm | 320px fixed |
| Width (desktop) | 256px (w-64) | 256px (w-64) | 256px (w-64) | 320px (w-80) |
| Position | right-0 fixed | right-0 fixed | right-0 fixed | left-0 fixed |
| Background | white | white | white | white |
| Border | border-r (desktop) | border-r (desktop) | border-r (desktop) | border-r |
| Shadow | shadow-2xl (mobile) | shadow-2xl (mobile) | shadow-2xl (mobile) | shadow-xl (always) |
| Animation | translate-x + opacity | translate-x | translate-x | transform + duration |
| Z-index | z-50 (mobile), z-auto | z-50, z-auto | z-50, z-auto | z-30 |
| Section border | border-b border-gray-200 | Same | Same | None (space-y-8) |
| Header bg | white | white | white | bg-gray-50/50 |

---

## 6. Props API Comparison

### Current APIs (Incompatible)

**Inventory:**
```jsx
<FilterPanel
  filters={filters}
  onFiltersChange={(newFilters) => setFilters(newFilters)}
  categories={categories}
  locations={locations}
  suppliers={suppliers}
  products={products}
  users={users}
  customers={customers}
  states={states}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  currentTab="overview"
/>
```

**Contact:**
```jsx
<FilterPanel
  filters={filters}
  onFiltersChange={(newFilters) => setFilters(newFilters)}
  stages={stages}
  channels={channels}
  tags={tags}
  maxRatingScale={10}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

**Sales:**
```jsx
<SalesFilterPanel
  filters={filters}
  onFiltersChange={(newFilters) => setFilters(newFilters)}
  customers={customers}
  salesPersons={salesPersons}
  organizationSlug={organizationSlug}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

**Project (Different API!):**
```jsx
<FilterPanel
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  filters={filters}
  onFilterChange={(type, value) => handleFilterChange(type, value)}
  templates={templates}
/>
```

---

## 7. Recommended Architecture

Based on analysis, I recommend **Option B: Composable Components** because:

1. **High variation in filter types** - Each panel has unique filter requirements
2. **Context-specific logic** - Inventory needs tab-awareness, Contact needs rating calculation
3. **Different data structures** - Each tool's data shapes are incompatible
4. **Maximum flexibility** - New filter types can be added without modifying base component
5. **Gradual migration** - Can migrate one tool at a time

### Option B: Composable Components

```jsx
// Base container
import { FilterPanel, FilterSection } from '@/components/ui/filter-panel';
import {
  CheckboxFilter,
  SearchableCheckboxFilter,
  DateRangeFilter,
  NumberRangeFilter
} from '@/components/ui/filters';

// Usage in Inventory
<FilterPanel
  isOpen={isOpen}
  onClose={onClose}
  onClearAll={handleClearAll}
  hasActiveFilters={hasActiveFilters}
>
  {currentTab === 'overview' && (
    <>
      <FilterSection title="Category" defaultExpanded>
        <SearchableCheckboxFilter
          options={categories}
          getOptionValue={(c) => c}
          getOptionLabel={(c) => c}
          value={filters.categories}
          onChange={(v) => updateFilter('categories', v)}
          searchPlaceholder="Search categories..."
        />
      </FilterSection>

      <FilterSection title="Stock Status">
        <CheckboxFilter
          options={STOCK_STATUS_OPTIONS}
          getOptionValue={(s) => s.id}
          getOptionLabel={(s) => s.label}
          value={filters.stockStatuses}
          onChange={(v) => updateFilter('stockStatuses', v)}
        />
      </FilterSection>

      <FilterSection title="Quantity Range">
        <NumberRangeFilter
          min={filters.minQuantity}
          max={filters.maxQuantity}
          onChange={(min, max) => {
            updateFilter('minQuantity', min);
            updateFilter('maxQuantity', max);
          }}
          minLabel="Min Quantity"
          maxLabel="Max Quantity"
        />
      </FilterSection>
    </>
  )}
</FilterPanel>

// Usage in Contact (with custom filter)
<FilterPanel isOpen={isOpen} onClose={onClose}>
  <FilterSection title="Customer Rating">
    <RatingRangeFilter
      maxScale={maxRatingScale}
      value={filters.ratings}
      onChange={(v) => updateFilter('ratings', v)}
    />
  </FilterSection>

  <FilterSection title="Tags">
    <CheckboxFilter
      options={tags}
      getOptionValue={(t) => t.id}
      renderOption={(tag) => <TagBadge tag={tag} size="xs" />}
      value={filters.tags}
      onChange={(v) => updateFilter('tags', v)}
    />
  </FilterSection>
</FilterPanel>
```

### Proposed Component Structure

```
src/components/ui/
├── filter-panel/
│   ├── index.js                  # Barrel export
│   ├── FilterPanel.jsx           # Container with drawer/sidebar
│   ├── FilterSection.jsx         # Collapsible section
│   └── FilterHeader.jsx          # Header with clear/close
├── filters/
│   ├── index.js                  # Barrel export
│   ├── CheckboxFilter.jsx        # Basic checkbox list
│   ├── SearchableCheckboxFilter.jsx  # Checkbox + search
│   ├── DateRangeFilter.jsx       # From/to date inputs
│   ├── NumberRangeFilter.jsx     # Min/max number inputs
│   └── ColorDotCheckboxFilter.jsx    # Checkbox with color dot (for stages)
```

---

## 8. Reusable Filter Components to Create

Based on analysis, these filter primitives should be shared:

| Component | Used In | Priority | Lines to Save |
|-----------|---------|----------|---------------|
| **FilterPanel (container)** | All 4 | Critical | ~200 (drawer/backdrop/header logic) |
| **FilterSection** | All 4 | Critical | ~40 per section |
| **CheckboxFilter** | All 4 | High | ~25 per usage |
| **SearchableCheckboxFilter** | Inventory only | High | ~50 per usage (5 instances = 250) |
| **DateRangeFilter** | Inventory, Project | Medium | ~22 per usage (5 instances = 110) |
| **NumberRangeFilter** | Inventory only | Medium | ~30 |
| **ColorDotCheckboxFilter** | Contact only | Low | ~35 |
| **RatingRangeFilter** | Contact only | Low | ~38 (custom, not generalizable) |

**Estimated total lines saved:** ~600-800 lines

---

## 9. Migration Complexity Assessment

| Panel | Complexity | Estimated Effort | Risk | Notes |
|-------|------------|------------------|------|-------|
| **Project** | Low | 2-3 hours | Low | Smallest, no mobile, different API needs normalization |
| **Sales** | Low | 3-4 hours | Low | Simple, only 3 checkbox filters |
| **Contact** | Medium | 1 day | Medium | Custom TagBadge, rating logic, CSS cleanup |
| **Inventory** | Very High | 2-3 days | High | 18 sections, tab context, 5 searchable lists, 5 date ranges |

---

## 10. Recommended Migration Order

1. **First: Project** (122 lines)
   - Simplest implementation
   - Isolated (no shared dependencies)
   - Different API can be normalized
   - Low risk if broken

2. **Second: Sales** (223 lines)
   - Second simplest
   - Standard checkbox pattern
   - Good for validating CheckboxFilter component
   - Uses hook for dynamic statuses

3. **Third: Contact** (353 lines)
   - Medium complexity
   - Custom TagBadge integration needed
   - Rating logic is unique
   - Validates custom renderOption pattern

4. **Last: Inventory** (1,008 lines)
   - Most complex
   - Tab context awareness
   - Searchable filters
   - Multiple date ranges
   - Breaking this would affect entire Inventory module

**Reason:** Start with simplest to build confidence in shared components. Each migration validates the abstraction. By the time we reach Inventory, all filter primitives should be battle-tested.

---

## 11. Risks and Considerations

### Breaking Changes
- Project FilterPanel uses different `onFilterChange(type, value)` API
- Will need wrapper or API normalization
- Inventory's tab-awareness may require special handling

### Edge Cases
- Contact's dynamic rating ranges (maxRatingScale 3-10)
- Inventory's exclusive radio-style checkbox (itemType)
- Sales' hook-based status fetching
- Project's non-functional date range (mock)

### CSS Considerations
- Contact's FilterPanel.css appears unused (component uses Tailwind)
- Should be deleted during migration
- Project uses different header styling (bg-gray-50/50)

### Performance
- Inventory has 5 search filters with local state
- Consider debouncing search inputs
- Consider virtualization for long option lists

### Testing Requirements
- Mobile drawer open/close
- Backdrop click-to-close
- Body scroll lock
- Section expand/collapse
- Filter state persistence
- Clear all functionality
- Active filter detection

---

## 12. Alternative Approaches Considered

### Option A: Single Monolithic Component (NOT Recommended)

```jsx
<FilterPanel
  config={[
    { type: 'checkbox', key: 'status', title: 'Status', options: [...] },
    { type: 'dateRange', key: 'createdAt', title: 'Created Date' },
  ]}
/>
```

**Rejected because:**
- Config object would be extremely complex for Inventory (18 sections)
- Hard to handle tab-specific visibility
- Custom renderers (TagBadge) don't fit config pattern
- Less flexible for tool-specific requirements

### Option C: Hybrid Config + Children (Partial Consideration)

```jsx
<FilterPanel
  sections={standardSections}
>
  <CustomRatingFilter />
</FilterPanel>
```

**Rejected because:**
- Still requires complex config for standard sections
- Mixing paradigms is confusing
- Option B is cleaner and more flexible

---

## Appendix: Full Filter Configuration Per Panel

### Inventory Filters by Tab

| Tab | Sections Shown |
|-----|----------------|
| overview | Category, Location, Stock Status, Quantity Range |
| products | Item Type, Category |
| movements | Location, Movement Type, Date Range, Operator |
| purchase-orders | Location, Supplier, PO Status, Order Date, Expected Delivery, Managed By |
| delivery-orders | Location, DO Status, Order Date, Customer, Created By |
| suppliers | State |

### Contact Filters
1. Contact Type (customer/supplier/coi/internal)
2. Stage (with color dots)
3. Traffic Source (channels)
4. Customer Rating (dynamic ranges)
5. Tags (with TagBadge)

### Sales Filters
1. Status (from useSalesOrderStatuses hook)
2. Customer
3. Sales Person

### Project Filters
1. Project Status (active/pending/completed/cancelled)
2. Template Type
3. Due Date (mock, non-functional)

---

*Report generated by Architecture Overseer Agent*
*Analysis completed: 2025-11-27*
