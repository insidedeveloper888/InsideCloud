# InsideCloud Design System

## Overview
This document defines the shared UI components and design tokens for InsideCloud.
All new development MUST use these components for consistency.

## Component Status

| Component | Status | Import |
|-----------|--------|--------|
| Button | ✅ Ready | `import { Button } from 'src/components/ui'` |
| Card | ✅ Ready | `import { Card } from 'src/components/ui'` |
| Tabs | ✅ Ready | `import { Tabs } from 'src/components/ui'` |
| Avatar | ✅ Ready | `import { Avatar } from 'src/components/ui'` |
| MemberSelect | ✅ Ready | `import { MemberSelect } from 'src/components/ui'` |
| Design Tokens | ✅ Ready | `import { buttonStyles } from 'src/lib/design-tokens'` |
| Pagination | ✅ Ready | `import { Pagination } from 'src/components/ui'` |
| ConfirmDialog | ✅ Ready | `import { ConfirmDialog } from 'src/components/ui'` |
| SearchableSelect | ✅ Ready | `import { SearchableSelect } from 'src/components/ui'` |

---

## Quick Start

### Importing Components
```jsx
import { Button, Card, MemberSelect, ConfirmDialog, SearchableSelect } from '@/components/ui';
// or
import { Button } from 'src/components/ui/button';
import { MemberSelect } from 'src/components/ui/member-select';
import { SearchableSelect } from 'src/components/ui/searchable-select';
```

### Importing Design Tokens
```jsx
import { buttonStyles, colors, badgeStyles } from '@/lib/design-tokens';
```

---

## Shared Components

### 1. MemberSelect
Team member dropdown with avatar display.

**Location:** `src/components/ui/member-select.jsx`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `members` | `Array` | Yes | Array of member objects `{ id, name, avatar_url }` |
| `value` | `string` | Yes | Currently selected member ID |
| `onChange` | `function` | Yes | Callback `(memberId) => void` |
| `placeholder` | `string` | No | Placeholder text (default: "Not assigned") |
| `name` | `string` | No | Form field name |

**Usage:**
```jsx
import { MemberSelect } from 'src/components/ui/member-select';

<MemberSelect
  members={teamMembers}
  value={selectedMemberId}
  onChange={(memberId) => setSelectedMemberId(memberId)}
  placeholder="Select assignee..."
/>
```

**Used In:**
- Contact Management: Sales Person, Customer Service assignment
- Sales Management: Quotation, Sales Order, Delivery Order, Invoice assignees

---

### 2. Pagination
List pagination with page numbers and navigation buttons.

**Location:** `src/components/ui/pagination.jsx`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentPage` | `number` | Yes | Current active page (1-indexed) |
| `totalItems` | `number` | Yes | Total number of items being paginated |
| `onPageChange` | `function` | Yes | Callback `(pageNumber) => void` |
| `itemsPerPage` | `number` | No | Items per page (default: 10) |
| `maxVisible` | `number` | No | Max page buttons to show (default: 5) |
| `showItemCount` | `boolean` | No | Show "Showing X-Y of Z" text (default: true) |

**Usage:**
```jsx
import { Pagination } from 'src/components/ui/pagination';

<Pagination
  currentPage={currentPage}
  totalItems={items.length}
  onPageChange={(page) => setCurrentPage(page)}
  itemsPerPage={10}
/>
```

**Used In:**
- Inventory Management: Products, Stock Overview, Movements tabs

---

### 3. ConfirmDialog
For delete/dangerous action confirmations with accessibility and keyboard support.

**Location:** `src/components/ui/confirm-dialog.jsx`

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Dialog visibility |
| `onClose` | `function` | Yes | - | Close handler |
| `onConfirm` | `function` | Yes | - | Confirm handler |
| `title` | `string` | Yes | - | Dialog title |
| `message` | `string` | Yes | - | Confirmation message |
| `variant` | `string` | No | `"danger"` | `"danger"` \| `"warning"` \| `"info"` \| `"default"` |
| `confirmText` | `string` | No | `"Confirm"` | Confirm button text |
| `cancelText` | `string` | No | `"Cancel"` | Cancel button text |
| `showIcon` | `boolean` | No | `true` | Show variant icon |
| `closeOnClickOutside` | `boolean` | No | `true` | Close when clicking backdrop |
| `closeOnEscape` | `boolean` | No | `true` | Close on Escape key |

**Features:**
- ✅ 4 variants (danger/warning/info/default) with appropriate icons and colors
- ✅ Escape key closes dialog
- ✅ Click outside closes dialog
- ✅ X button for close
- ✅ ARIA accessibility (role="dialog", aria-modal, aria-labelledby)
- ✅ Design token integration for consistent styling

**Usage:**
```jsx
import { ConfirmDialog } from 'src/components/ui/confirm-dialog';

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="This action cannot be undone."
  variant="danger"
  confirmText="Delete"
  cancelText="Keep"
/>
```

**Used In:**
- Sales Management: All list views (Quotations, Sales Orders, Delivery Orders, Invoices)
- Sales Management: Template Builder (delete section/component, close unsaved)
- Sales Management: Settings (delete status, delete team)
- Contact Management: Delete contact confirmation

---

### 4. SearchableSelect
Flexible dropdown select with search, keyboard navigation, and custom rendering.

**Location:** `src/components/ui/searchable-select.jsx`

**Features:**
- ✅ Search/filter options with customizable search keys
- ✅ Keyboard navigation (Arrow keys, Enter, Escape, Tab)
- ✅ Click outside to close
- ✅ Custom option and selected value rendering
- ✅ Create new items inline (`creatable` prop)
- ✅ Loading and disabled states
- ✅ Error state with message display
- ✅ ARIA accessibility (role="listbox", aria-selected, aria-expanded)
- ✅ Design token integration

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | required | Selected value |
| `onChange` | `function` | required | Called with new value `(value) => void` |
| `options` | `array` | `[]` | Array of option objects |
| `getOptionValue` | `function` | `(o) => o.id` | Extract value from option |
| `getOptionLabel` | `function` | `(o) => o.name` | Extract display label |
| `placeholder` | `string` | `"Select..."` | Placeholder text |
| `searchable` | `boolean` | `true` | Show search input |
| `searchPlaceholder` | `string` | `"Search..."` | Search input placeholder |
| `searchKeys` | `array` | `null` | Fields to search, e.g., `['name', 'email']` |
| `filterFn` | `function` | `null` | Custom filter `(option, term) => boolean` |
| `clearable` | `boolean` | `false` | Show clear button (X) |
| `creatable` | `boolean` | `false` | Allow creating new items |
| `onCreate` | `function` | `null` | Called with input value |
| `createLabel` | `function` | `(input) => \`+ Add "${input}"\`` | Label for create option |
| `filterOptions` | `function` | `null` | Pre-filter options before display |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable interaction |
| `error` | `string` | `null` | Error message to display |
| `renderOption` | `function` | `null` | Custom option renderer |
| `renderSelected` | `function` | `null` | Custom selected display |
| `renderEmpty` | `function` | `null` | Custom empty state |
| `minDropdownWidth` | `number` | `300` | Minimum dropdown width (px) |
| `maxDropdownHeight` | `number` | `320` | Max dropdown height (px) |

**Basic Usage:**
```jsx
import { SearchableSelect } from 'src/components/ui/searchable-select';

<SearchableSelect
  value={selectedId}
  onChange={setSelectedId}
  options={items}
  getOptionValue={(item) => item.id}
  getOptionLabel={(item) => item.name}
  placeholder="Select item..."
  searchable
  clearable
/>
```

**With Custom Rendering:**
```jsx
<SearchableSelect
  value={customerId}
  onChange={setCustomerId}
  options={customers}
  getOptionValue={(c) => c.id}
  getOptionLabel={(c) => c.company_name || `${c.first_name} ${c.last_name}`}
  searchKeys={['company_name', 'first_name', 'last_name', 'email']}
  searchPlaceholder="Search by name or email..."
  clearable
  renderOption={(customer, { isSelected }) => (
    <div className="flex flex-col">
      <span className="font-medium">
        {customer.company_name || `${customer.first_name} ${customer.last_name}`}
      </span>
      {customer.email && (
        <span className="text-xs text-gray-500">{customer.email}</span>
      )}
    </div>
  )}
/>
```

**With Create New:**
```jsx
<SearchableSelect
  value={selectedCategory}
  onChange={setSelectedCategory}
  options={categories}
  getOptionValue={(c) => c.value}
  getOptionLabel={(c) => c.label}
  creatable
  onCreate={(inputValue) => {
    const newCategory = { value: inputValue.toLowerCase(), label: inputValue };
    setCategories([...categories, newCategory]);
    setSelectedCategory(newCategory.value);
  }}
  createLabel={(input) => `+ Create "${input}"`}
/>
```

**With Pre-filtering:**
```jsx
<SearchableSelect
  value={quotationId}
  onChange={setQuotationId}
  options={quotations}
  getOptionValue={(q) => q.id}
  getOptionLabel={(q) => q.quotation_code}
  filterOptions={(opts) => opts.filter(q => !q.converted_to_sales_order_id)}
  searchKeys={['quotation_code', 'customer_name']}
/>
```

**Used In:**
- Can replace: CustomerSelect, ProductSelect, StatusSelect, QuotationSelect, SalesOrderSelect, DeliveryOrderSelect
- Inventory: SearchableSelect (with `creatable`)

---

### 5. Button (shadcn/ui)
Standard button component with variants.

**Location:** `src/components/ui/button.jsx`

**Variants:**
| Variant | Use For |
|---------|---------|
| `default` | Primary actions (Submit, Save) |
| `destructive` | Dangerous actions (Delete) |
| `outline` | Secondary actions |
| `secondary` | Tertiary actions |
| `ghost` | Minimal styling |
| `link` | Link-style button |

**Usage:**
```jsx
import { Button } from 'src/components/ui/button';

<Button variant="default">Submit</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Skip</Button>
```

---

### 5. Card (shadcn/ui)
Content container component.

**Location:** `src/components/ui/card.jsx`

**Usage:**
```jsx
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

---

## Design Tokens

### Button Styles
```jsx
import { buttonStyles } from '@/lib/design-tokens';

// Primary action button
<button className={buttonStyles.primary}>Submit</button>

// Danger/Delete button
<button className={buttonStyles.danger}>Delete</button>

// Secondary/Cancel button
<button className={buttonStyles.secondary}>Cancel</button>

// Ghost/Minimal button
<button className={buttonStyles.ghost}>Skip</button>
```

### Badge Styles
```jsx
import { badgeStyles } from '@/lib/design-tokens';

<span className={badgeStyles.success}>Active</span>
<span className={badgeStyles.warning}>Pending</span>
<span className={badgeStyles.danger}>Overdue</span>
<span className={badgeStyles.info}>Draft</span>
```

### Colors
```jsx
import { colors } from '@/lib/design-tokens';

// Background colors
<div className={colors.success.bg}>Success background</div>
<div className={colors.danger.bg}>Error background</div>

// Text colors
<span className={colors.success.text}>Success text</span>
<span className={colors.danger.text}>Error text</span>
```

### Border Radius
| Element | Token | Class |
|---------|-------|-------|
| Modals | `radius.modal` | `rounded-xl` |
| Cards | `radius.card` | `rounded-xl` |
| Buttons | `radius.button` | `rounded-lg` |
| Inputs | `radius.input` | `rounded-md` |
| Badges | `radius.badge` | `rounded-full` |

---

## Adding New Shared Components

### Step-by-Step Process

1. **Check for existing component**
   - Search `src/components/ui/` for similar functionality
   - Search tool folders for implementations to consolidate

2. **Create component file**
   ```
   src/components/ui/[component-name].jsx
   ```

3. **Use design tokens for styling**
   ```jsx
   import { colors, radius } from '@/lib/design-tokens';
   ```

4. **Add JSDoc documentation**
   ```jsx
   /**
    * ComponentName - Brief description
    * @param {string} props.value - Description
    * @param {function} props.onChange - Description
    */
   ```

5. **Export from component**
   ```jsx
   export function ComponentName() { ... }
   export default ComponentName;
   ```

6. **Add to index.js** (if exists)
   ```jsx
   // src/components/ui/index.js
   export { ComponentName } from './component-name';
   ```

7. **Document in this file**
   - Add component section with props table
   - Add usage example
   - List which tools use it

8. **Update .clinerules**
   - Add to shared components table

---

## Migration Status

| Component | Status | Current Location | Notes |
|-----------|--------|------------------|-------|
| MemberSelect | ✅ Done | `src/components/ui/member-select.jsx` | Consolidated from contact/sales |
| Button | ✅ Exists | `src/components/ui/button.jsx` | shadcn/ui, underutilized |
| Card | ✅ Exists | `src/components/ui/card.jsx` | shadcn/ui, underutilized |
| Tabs | ✅ Exists | `src/components/ui/tabs.jsx` | shadcn/ui, underutilized |
| Avatar | ✅ Exists | `src/components/ui/avatar.jsx` | shadcn/ui, underutilized |
| Pagination | ✅ Done | `src/components/ui/pagination.jsx` | Consolidated from inventory |
| ConfirmDialog | ✅ Done | `src/components/ui/confirm-dialog.jsx` | Consolidated from sales-management |
| Modal | 📋 Planned | `src/tools/inventory/components/Modal.jsx` | Move best version |
| FilterPanel | 📋 Planned | 4 implementations | Complex, needs abstraction |
| SearchableSelect | ✅ Done | `src/components/ui/searchable-select.jsx` | Base component ready, migration pending |
| FormField | 📋 Planned | 2 implementations | Consolidate |
| StatusBadge | 📋 Planned | Inline everywhere | Create shared |

---

## Reference Implementation

For best practices in component usage, refer to:
- `src/tools/inventory/` - Best Tailwind patterns
- `src/tools/sales-management/` - Most comprehensive tool

---

## Related Documentation

- [Component Audit Report](../refactor/component-audit.md) - Full analysis of component fragmentation
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Architecture decisions and UI standards
- [.clinerules](../../.clinerules) - Development rules including UI guidelines

---

*Last Updated: 2025-11-27*
*Maintainer: Architecture Overseer Agent*
