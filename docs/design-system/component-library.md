# Component Library Reference

> **Rule**: Check this file BEFORE creating any new UI component

---

## Available Shared Components

All components located in: `src/components/ui/`

| Component | File | Import | Use For |
|-----------|------|--------|---------|
| **Button** | `button.jsx` | `import { Button } from '@/components/ui/button'` | All buttons |
| **Card** | `card.jsx` | `import { Card, CardHeader, CardContent } from '@/components/ui/card'` | Content containers |
| **Tabs** | `tabs.jsx` | `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'` | Tab navigation |
| **Avatar** | `avatar.jsx` | `import { Avatar } from '@/components/ui/avatar'` | User avatars |
| **MemberSelect** | `member-select.jsx` | `import { MemberSelect } from '@/components/ui/member-select'` | Internal team member dropdowns |
| **Pagination** | `pagination.jsx` | `import { Pagination } from '@/components/ui/pagination'` | List pagination |
| **ConfirmDialog** | `confirm-dialog.jsx` | `import { ConfirmDialog } from '@/components/ui/confirm-dialog'` | Delete/dangerous confirmations |
| **SearchableSelect** | `searchable-select.jsx` | `import { SearchableSelect } from '@/components/ui/searchable-select'` | Dropdown with search + keyboard nav |

---

## Component Usage Examples

### Button

```jsx
import { Button } from '@/components/ui/button';

// Primary action button
<Button onClick={handleSave}>Save</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// With icon
<Button>
  <Plus size={16} className="mr-2" />
  Add Item
</Button>
```

**Available Variants**: `default`, `secondary`, `destructive`, `outline`, `ghost`

---

### Card

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Customer Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Name: John Doe</p>
    <p>Email: john@example.com</p>
  </CardContent>
</Card>
```

---

### SearchableSelect

```jsx
import { SearchableSelect } from '@/components/ui/searchable-select';

<SearchableSelect
  value={selectedCustomerId}
  onChange={setSelectedCustomerId}
  options={customers.map(c => ({
    value: c.id,
    label: c.name,
    meta: c.email  // Optional secondary text
  }))}
  placeholder="Select customer..."
  searchPlaceholder="Search customers..."
  emptyMessage="No customers found"
/>
```

**Features**:
- ✅ Keyboard navigation (↑/↓, Enter, Esc)
- ✅ Search filtering
- ✅ Clear button
- ✅ Accessible (ARIA labels)

---

### MemberSelect

```jsx
import { MemberSelect } from '@/components/ui/member-select';

<MemberSelect
  value={assignedMemberId}
  onChange={setAssignedMemberId}
  organizationSlug={organizationSlug}
  placeholder="Assign to..."
/>
```

**Note**: Automatically fetches organization members from backend.

---

### ConfirmDialog

```jsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const [confirmDialog, setConfirmDialog] = useState({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {}
});

// Trigger dialog
const handleDelete = (itemId) => {
  setConfirmDialog({
    isOpen: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    onConfirm: async () => {
      await deleteItem(itemId);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  });
};

// Render dialog
<ConfirmDialog
  isOpen={confirmDialog.isOpen}
  onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
  onConfirm={confirmDialog.onConfirm}
  title={confirmDialog.title}
  message={confirmDialog.message}
/>
```

---

### Pagination

```jsx
import { Pagination } from '@/components/ui/pagination';

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
const totalItems = 100;

<Pagination
  currentPage={currentPage}
  totalPages={Math.ceil(totalItems / itemsPerPage)}
  onPageChange={setCurrentPage}
/>
```

---

### Tabs

```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>

  <TabsContent value="details">
    <Card>Details content...</Card>
  </TabsContent>

  <TabsContent value="history">
    <Card>History content...</Card>
  </TabsContent>

  <TabsContent value="settings">
    <Card>Settings content...</Card>
  </TabsContent>
</Tabs>
```

---

## Design Tokens

**File**: `src/lib/design-tokens.js`

### Colors

```javascript
import { colors } from '@/lib/design-tokens';

// Use instead of hardcoded Tailwind classes
<div className={colors.primary}>Blue text</div>
<div className={colors.secondary}>Gray text</div>
<div className={colors.success}>Green text</div>
<div className={colors.danger}>Red text</div>
```

### Button Styles

```javascript
import { buttonStyles } from '@/lib/design-tokens';

<button className={buttonStyles.primary}>Primary</button>
<button className={buttonStyles.secondary}>Secondary</button>
<button className={buttonStyles.destructive}>Delete</button>
```

### Badge Styles

```javascript
import { badgeStyles } from '@/lib/design-tokens';

<span className={badgeStyles.success}>Active</span>
<span className={badgeStyles.warning}>Pending</span>
<span className={badgeStyles.danger}>Cancelled</span>
```

---

## Creating New Components

**BEFORE creating a new component**, answer these questions:

1. **Does a similar component already exist?**
   - Check `src/components/ui/` directory
   - Check this file's component list
   - If similar exists, can you extend it with props?

2. **Will this be reused across multiple modules?**
   - **YES** → Create in `src/components/ui/`
   - **NO** → Create in module-specific folder (e.g., `src/tools/sales-management/components/`)

3. **Can you use composition instead of new component?**
   - Example: Need a "card with icon" → Compose `<Card>` + `<Icon>`, don't create `<IconCard>`

### Component Creation Checklist

If you decide to create a new shared component:

- [ ] Place in: `src/components/ui/{component-name}.jsx`
- [ ] Use design tokens from `src/lib/design-tokens.js`
- [ ] Add to exports in `src/components/ui/index.js`
- [ ] Document in this file (add to table above)
- [ ] Add usage example
- [ ] Follow existing naming conventions (kebab-case for files, PascalCase for components)

---

## Common Anti-Patterns (DON'T DO THIS)

### ❌ Anti-Pattern 1: Creating tool-specific buttons

```jsx
// BAD - Duplicating Button component in sales-management
src/tools/sales-management/components/SalesButton.jsx

// GOOD - Use shared Button
import { Button } from '@/components/ui/button';
```

---

### ❌ Anti-Pattern 2: Hardcoded colors

```jsx
// BAD
<div className="bg-blue-600 text-white">...</div>

// GOOD - Use design tokens
import { colors } from '@/lib/design-tokens';
<div className={`${colors.primaryBg} ${colors.primaryText}`}>...</div>
```

---

### ❌ Anti-Pattern 3: Creating modal/dialog variants

```jsx
// BAD - Creating SalesOrderDialog, ContactDialog, etc.
src/tools/sales-management/components/SalesOrderDialog.jsx
src/tools/contact-management/components/ContactDialog.jsx

// GOOD - Reuse modal structure, customize content
import { Dialog } from '@/components/ui/dialog';

function SalesOrderForm() {
  return (
    <Dialog isOpen={...} onClose={...}>
      {/* Custom form content here */}
    </Dialog>
  );
}
```

---

## Best Practices

### 1. Component Composition

Build complex UIs by composing simple components:

```jsx
// Instead of creating <CustomerCard>, compose:
<Card>
  <CardHeader>
    <Avatar src={customer.avatar} />
    <CardTitle>{customer.name}</CardTitle>
  </CardHeader>
  <CardContent>
    <p>{customer.email}</p>
    <Button onClick={handleEdit}>Edit</Button>
  </CardContent>
</Card>
```

### 2. Props for Customization

Extend shared components with props instead of creating variants:

```jsx
// ✅ GOOD - Extend SearchableSelect
<SearchableSelect
  options={products}
  renderOption={(product) => (
    <div className="flex items-center gap-2">
      <img src={product.image} className="w-8 h-8" />
      <span>{product.name}</span>
    </div>
  )}
/>
```

### 3. Responsive Design

All shared components are mobile-responsive. Use breakpoint prefixes:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

---

## Reference Examples

**Best reference for component usage**:
- **Inventory Management**: `src/tools/inventory/` (good use of shared components)
- **Sales Management**: `src/tools/sales-management/` (consistent button/card usage)
- **Contact Management**: `src/tools/contact-management/` (good SearchableSelect examples)

---

## Related Documentation

- **Design Tokens**: `src/lib/design-tokens.js`
- **Tailwind Config**: `tailwind.config.js`
- **Component Index**: `src/components/ui/index.js`

---

Last Updated: 2025-11-28
