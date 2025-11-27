# SearchableSelect Components Analysis

**Date:** 2025-11-26
**Auditor:** Architecture Overseer Agent
**Total Components:** 7

---

## 1. Feature Comparison Matrix

| Feature | Inventory SearchableSelect | CustomerSelect | ProductSelect | StatusSelect | QuotationSelect | SalesOrderSelect | DeliveryOrderSelect |
|---------|---------------------------|----------------|---------------|--------------|-----------------|------------------|---------------------|
| **Lines of code** | 120 | 139 | 139 | 89 | 158 | 164 | 161 |
| **Has search input** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Search icon** | ❌ | ✅ | ✅ | - | ✅ | ✅ | ✅ |
| **Click outside to close** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Escape key to close** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Keyboard navigation** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **"Add new" option** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Clear selection (X)** | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Loading state** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Error state** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Disabled state** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Multi-select** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Custom render option** | ❌ (label only) | ✅ (name+email) | ✅ (name+SKU+price) | ✅ (label only) | ✅ (code+name+amount+status) | ✅ (code+name+amount+status) | ✅ (code+name+date+status) |
| **Custom render selected** | ❌ | ✅ | ✅ (with SKU) | ❌ | ✅ (code + name) | ✅ (code + name) | ✅ (code + name) |
| **Auto-focus search on open** | ✅ | ✅ (setTimeout) | ✅ (setTimeout) | - | ✅ (setTimeout) | ✅ (setTimeout) | ✅ (setTimeout) |
| **Filter by status/state** | ❌ | ❌ | ❌ | ❌ | ✅ (filterConverted) | ✅ (filterCompleted, filterFullyDelivered) | ✅ (filterDelivered) |
| **Status badge in options** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Shows amount/price** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |

---

## 2. Props Comparison

### 2.1 Inventory SearchableSelect
```jsx
{
  value: any,                      // Selected option value
  onChange: (value) => void,       // Direct value callback
  options: Array<{value, label}>,  // Generic label/value pairs
  placeholder: string,             // Default: 'Select...'
  className: string,               // Container className
  allowAddNew: boolean,            // Default: false
  onAddNew: (inputValue) => void,  // Callback for new item creation
  addNewLabel: string              // Default: '+ Add New...'
}
```

### 2.2 CustomerSelect
```jsx
{
  value: string,                   // Customer ID
  onChange: ({target: {value}}) => void, // Event-style callback
  customers: Array<{               // Customer objects
    id, company_name, first_name,
    last_name, email
  }>,
  placeholder: string,             // Default: "Select Customer..."
  className: string,
  required: boolean                // Default: false (not used)
}
```

### 2.3 ProductSelect
```jsx
{
  value: string,                   // Product ID
  onChange: ({target: {value}}) => void,
  products: Array<{                // Product objects
    id, name, product_name,
    sku, unit_price, price
  }>,
  placeholder: string,             // Default: "Select Product..."
  className: string
}
```

### 2.4 StatusSelect
```jsx
{
  value: string,                   // Status key
  onChange: ({target: {value}}) => void,
  statuses: Array<{                // Status objects
    status_key, status_label
  }>,
  placeholder: string,             // Default: "Select Status..."
  className: string
}
```

### 2.5 QuotationSelect
```jsx
{
  value: string,                   // Quotation ID
  onChange: ({target: {value}}) => void,
  quotations: Array<{              // Quotation objects
    id, quotation_code, customer_name,
    customer, total_amount, status,
    converted_to_sales_order_id
  }>,
  placeholder: string,             // Default: "Select Quotation..."
  className: string,
  filterConverted: boolean         // Default: true (filter out converted)
}
```

### 2.6 SalesOrderSelect
```jsx
{
  value: string,                   // Sales Order ID
  onChange: ({target: {value}}) => void,
  salesOrders: Array<{             // Sales Order objects
    id, order_code, customer_name,
    customer, total_amount, status,
    is_fully_delivered
  }>,
  placeholder: string,             // Default: "Select Sales Order..."
  className: string,
  filterCompleted: boolean,        // Default: false
  filterFullyDelivered: boolean    // Default: false
}
```

### 2.7 DeliveryOrderSelect
```jsx
{
  value: string,                   // Delivery Order ID
  onChange: ({target: {value}}) => void,
  deliveryOrders: Array<{          // Delivery Order objects
    id, delivery_order_code, customer_name,
    customer, delivery_date, status
  }>,
  placeholder: string,             // Default: "Select Delivery Order..."
  className: string,
  filterDelivered: boolean         // Default: false
}
```

---

## 3. Common Patterns (Shared Code)

### 3.1 State Management
All components use the same state pattern:
```jsx
const [isOpen, setIsOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState(''); // except StatusSelect
const dropdownRef = useRef(null);
const searchInputRef = useRef(null); // except Inventory and StatusSelect
```

### 3.2 Click Outside Detection
**Identical pattern in ALL 7 components:**
```jsx
useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isOpen]);
```

### 3.3 ChevronDown Animation
**Identical in ALL 7 components:**
```jsx
<ChevronDown
  size={16} // or w-4 h-4
  className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
/>
```

### 3.4 Dropdown Container Structure
**Nearly identical in 6 of 7 (all except Inventory):**
```jsx
<div className="absolute z-50 mt-1 w-full min-w-[400px] bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col left-0">
  {/* Search Header (optional) */}
  <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input ... />
    </div>
  </div>

  {/* Options List */}
  <div className="overflow-y-auto flex-1 p-1">
    {/* Options */}
  </div>
</div>
```

### 3.5 Selection Handling
**Two different callback patterns:**

**Pattern A: Direct value (Inventory only)**
```jsx
onChange(opt.value);
```

**Pattern B: Event-style (All Sales Management)**
```jsx
onChange({ target: { value: orderId } });
```

### 3.6 Option Styling
**Identical hover/selected states:**
```jsx
className={`w-full px-3 py-2 text-left hover:bg-blue-50 rounded-md ... ${
  value === item.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''
}`}
```

---

## 4. Unique Features Per Component

### 4.1 Inventory SearchableSelect
**Unique features:**
- `allowAddNew` prop for creating new items inline
- Shows tip text: "Type a new value and click Add to create it"
- "Add" button disabled when search is empty
- Uses `options: [{value, label}]` format (generic)
- Different border styling: `border-2 border-gray-200 rounded-xl` (thicker, more rounded)
- Focus ring: `focus:ring-emerald-500` (green)
- Hover: `hover:bg-emerald-50` (green)
- z-index: `z-[9999]` (higher than others)

### 4.2 CustomerSelect
**Unique features:**
- Searches by: company_name, first_name+last_name, email
- Shows email under customer name in options
- Handles both individual (first/last name) and company customers
- Fixed dropdown width: `w-[400px]`

### 4.3 ProductSelect
**Unique features:**
- Searches by: name/product_name, SKU
- Shows SKU in parentheses when selected: "Product Name (SKU123)"
- Shows price aligned right: "RM 1,234.56"
- Handles dual field names: `name || product_name`, `unit_price || price`
- Border radius: `rounded-md` (less rounded than CustomerSelect's `rounded-lg`)

### 4.4 StatusSelect
**Unique features:**
- **No search functionality** (simple dropdown)
- Uses `status_key` and `status_label` fields
- Simplest implementation (89 lines)
- No clear button (X)
- Only shows label text, no badges or colors

### 4.5 QuotationSelect
**Unique features:**
- `filterConverted` prop (default: true) - filters out quotations that have been converted to sales orders
- Also filters out cancelled quotations
- Shows status badge with color coding:
  - accepted: green
  - sent: blue
  - rejected: red
  - default: gray
- Shows total amount: "RM X,XXX.XX"
- Searches by: quotation_code, customer_name

### 4.6 SalesOrderSelect
**Unique features:**
- `filterCompleted` prop - filters out completed/cancelled orders
- `filterFullyDelivered` prop - filters out fully delivered orders
- Shows status badge with color coding:
  - completed: green
  - confirmed: blue
  - cancelled: red
- Shows total amount
- Searches by: order_code, customer_name

### 4.7 DeliveryOrderSelect
**Unique features:**
- `filterDelivered` prop - filters out delivered/cancelled orders
- Shows delivery date instead of amount
- Shows status badge with color coding:
  - delivered: green
  - in_transit: yellow
  - ready: blue
  - cancelled: red
- Searches by: delivery_order_code, customer_name

---

## 5. Code Duplication Analysis

### 5.1 Lines of Code Breakdown

| Component | Total Lines | Click-outside Effect | Trigger Button | Dropdown | Search | Option Rendering |
|-----------|-------------|---------------------|----------------|----------|--------|------------------|
| Inventory | 120 | 10 | 12 | 52 | 12 | 15 |
| CustomerSelect | 139 | 18 | 26 | 40 | 12 | 15 |
| ProductSelect | 139 | 18 | 26 | 40 | 12 | 16 |
| StatusSelect | 89 | 15 | 16 | 25 | 0 | 12 |
| QuotationSelect | 158 | 18 | 30 | 45 | 12 | 28 |
| SalesOrderSelect | 164 | 18 | 30 | 45 | 12 | 28 |
| DeliveryOrderSelect | 161 | 18 | 30 | 45 | 12 | 28 |

**Total: 970 lines of code**

### 5.2 Estimated Duplicate Code

| Pattern | Occurrences | Lines per Instance | Total Duplicate Lines |
|---------|-------------|-------------------|----------------------|
| Click-outside effect | 7 | ~15 | ~105 |
| Trigger button structure | 7 | ~20 | ~140 |
| Dropdown container | 7 | ~15 | ~105 |
| Search input | 6 | ~12 | ~72 |
| Clear button (X) | 5 | ~8 | ~40 |
| Selected highlight | 7 | ~4 | ~28 |

**Estimated duplicate code: ~490 lines (50%)**

---

## 6. Styling Inconsistencies

### 6.1 Border Styles
| Component | Border Style |
|-----------|--------------|
| Inventory | `border-2 border-gray-200 rounded-xl` |
| Customer/Status/Quotation/Sales/Delivery | `border border-gray-300 rounded-lg` |
| Product | `border border-gray-300 rounded-md` |

### 6.2 Focus Ring Colors
| Component | Focus Ring |
|-----------|------------|
| Inventory | `focus:ring-emerald-500` (green) |
| All others | `focus:ring-blue-500` (blue) |

### 6.3 Hover Colors
| Component | Hover Color |
|-----------|-------------|
| Inventory | `hover:bg-emerald-50` (green) |
| All others | `hover:bg-blue-50` (blue) |

### 6.4 z-index Values
| Component | z-index |
|-----------|---------|
| Inventory | `z-[9999]` |
| All others | `z-50` |

### 6.5 Dropdown Width
| Component | Width |
|-----------|-------|
| Inventory | `w-full` |
| CustomerSelect | `w-[400px]` |
| ProductSelect | `w-[400px]` |
| StatusSelect | `w-full` |
| Others | `w-full min-w-[400px]` |

---

## 7. Recommended Base Component API

Based on comprehensive analysis, the unified `SearchableSelect` should support:

```jsx
<SearchableSelect
  // ==================== Required Props ====================
  value={value}                            // Selected value (any type)
  onChange={(value) => void}               // Direct value callback (not event-style)
  options={[]}                             // Array of option objects

  // ==================== Display Props ====================
  placeholder="Select..."                  // Placeholder text
  getOptionValue={(option) => option.id}   // How to get value from option
  getOptionLabel={(option) => option.name} // How to get display label

  // ==================== Search Props ====================
  searchable={true}                        // Show search input (default: true)
  searchPlaceholder="Search..."            // Search input placeholder
  searchKeys={["name", "email"]}           // Fields to search in (or custom filter)
  filterFn={(option, searchTerm) => bool}  // Custom filter function (overrides searchKeys)

  // ==================== Custom Rendering ====================
  renderOption={(option, isSelected) => ReactNode}  // Custom option renderer
  renderSelected={(option) => ReactNode}            // Custom selected display
  renderEmpty={(searchTerm) => ReactNode}           // Custom empty state

  // ==================== Clear / Create ====================
  clearable={true}                         // Show clear button (X)
  onClear={() => void}                     // Optional clear callback
  creatable={false}                        // Show "Add new" option
  onCreate={(inputValue) => void}          // Callback for new item
  createLabel={(input) => `+ Add "${input}"`} // Label for create option

  // ==================== Filter Props ====================
  filterOptions={(options) => options}     // Pre-filter options (e.g., filterConverted)

  // ==================== State Props ====================
  loading={false}                          // Show loading spinner
  disabled={false}                         // Disable interaction
  error={null}                             // Error message/state

  // ==================== Behavior Props ====================
  closeOnSelect={true}                     // Close after selection
  closeOnClickOutside={true}               // Close when clicking outside
  closeOnEscape={true}                     // Close on Escape key (NEW!)
  autoFocus={true}                         // Focus search on open

  // ==================== Styling Props ====================
  className=""                             // Container className
  dropdownClassName=""                     // Dropdown className
  minWidth={400}                           // Minimum dropdown width
  maxHeight={320}                          // Max dropdown height

  // ==================== Accessibility ====================
  name=""                                  // Form field name
  id=""                                    // Element ID
  aria-label=""                            // Accessibility label
/>
```

### 7.1 Wrapper Components Pattern

After creating the base, entity-specific wrappers remain simple:

```jsx
// CustomerSelect.jsx (simplified)
export function CustomerSelect({ customers, ...props }) {
  return (
    <SearchableSelect
      {...props}
      options={customers}
      getOptionValue={(c) => c.id}
      getOptionLabel={(c) => c.company_name || `${c.first_name} ${c.last_name}`}
      searchKeys={['company_name', 'first_name', 'last_name', 'email']}
      searchPlaceholder="Search by name or email..."
      renderOption={(customer, isSelected) => (
        <div className="flex flex-col">
          <span className="font-medium">{customer.company_name || `${customer.first_name} ${customer.last_name}`}</span>
          {customer.email && <span className="text-xs text-gray-500">{customer.email}</span>}
        </div>
      )}
    />
  );
}
```

---

## 8. Migration Complexity Assessment

| Component | Can Use Base Directly? | Custom Rendering Needed? | Special Props | Migration Effort |
|-----------|------------------------|-------------------------|---------------|------------------|
| **Inventory SearchableSelect** | ✅ Yes | ❌ No (uses label) | `creatable`, `onCreate` | **Low** - Already generic |
| **CustomerSelect** | ✅ Yes | ✅ Yes (email display) | None | **Medium** - Custom option render |
| **ProductSelect** | ✅ Yes | ✅ Yes (SKU, price) | None | **Medium** - Custom option render |
| **StatusSelect** | ✅ Yes | ❌ No | `searchable={false}` | **Low** - Simple select |
| **QuotationSelect** | ✅ Yes | ✅ Yes (code, amount, status badge) | `filterOptions` | **Medium** - Custom render + filter |
| **SalesOrderSelect** | ✅ Yes | ✅ Yes (code, amount, status badge) | `filterOptions` | **Medium** - Custom render + filter |
| **DeliveryOrderSelect** | ✅ Yes | ✅ Yes (code, date, status badge) | `filterOptions` | **Medium** - Custom render + filter |

---

## 9. Recommended Migration Order

### Phase 1: Create Base Component
1. **Create `src/components/ui/searchable-select.jsx`**
   - Implement all core features from the API above
   - Include keyboard navigation (new!)
   - Include Escape key close (new!)
   - Include loading state (new!)
   - Use design tokens for consistent styling

### Phase 2: Migrate Simplest First
2. **StatusSelect** (simplest - no search, no custom render)
   - Use `searchable={false}`
   - Test basic functionality

3. **Inventory SearchableSelect** (already generic)
   - Enable `creatable` prop
   - Verify `onCreate` callback

### Phase 3: Migrate Entity Selects
4. **CustomerSelect**
   - Create wrapper with custom `renderOption`
   - Handle email display

5. **ProductSelect**
   - Create wrapper with custom `renderOption`
   - Handle SKU and price display

6. **QuotationSelect**
   - Create wrapper with custom `renderOption` and `filterOptions`
   - Handle status badges

7. **SalesOrderSelect** (nearly identical to Quotation)
   - Copy pattern from QuotationSelect

8. **DeliveryOrderSelect** (nearly identical)
   - Copy pattern from SalesOrderSelect
   - Handle date display instead of amount

### Phase 4: Cleanup
9. **Delete old component files**
10. **Update all imports**
11. **Verify build passes**

---

## 10. Breaking Changes to Address

### 10.1 onChange Callback Signature
**Current inconsistency:**
- Inventory: `onChange(value)`
- Sales Management: `onChange({ target: { value } })`

**Recommendation:** Standardize to direct value: `onChange(value)`
- More intuitive
- Works with controlled components
- Consumers can wrap if they need event-style

### 10.2 Options Data Structure
**Current inconsistency:**
- Inventory: `options: [{value, label}]`
- Others: Entity-specific objects `[{id, name, ...}]`

**Recommendation:** Use `getOptionValue` and `getOptionLabel` props to normalize.

---

## 11. Estimated Impact

### 11.1 Code Reduction
- **Before:** 970 lines across 7 files
- **After:** ~200 lines base + 7 × ~30 lines wrappers = ~410 lines
- **Reduction:** ~560 lines (~58% reduction)

### 11.2 Maintenance Benefits
- Single source of truth for dropdown behavior
- Consistent keyboard navigation
- Consistent accessibility
- Design token integration
- Easier to add new features (loading, error states, multi-select)

### 11.3 Risk Assessment
- **Low risk:** Components are self-contained
- **Medium risk:** Different `onChange` signatures may affect parent components
- **Mitigation:** Run full test suite, check all form submissions

---

## Appendix A: Full Props Summary Table

| Prop | Inventory | Customer | Product | Status | Quotation | SalesOrder | DeliveryOrder |
|------|-----------|----------|---------|--------|-----------|------------|---------------|
| value | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| onChange | ✅ (direct) | ✅ (event) | ✅ (event) | ✅ (event) | ✅ (event) | ✅ (event) | ✅ (event) |
| options/items | options | customers | products | statuses | quotations | salesOrders | deliveryOrders |
| placeholder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| className | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| required | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| allowAddNew | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| onAddNew | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| addNewLabel | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| filterConverted | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| filterCompleted | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| filterFullyDelivered | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| filterDelivered | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

*Report generated by Architecture Overseer Agent*
