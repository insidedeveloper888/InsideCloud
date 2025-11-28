# Modularization Standards

> **Purpose**: Enforce consistent module structure across all tools

---

## 🎯 Module Structure Rules

### Rule 1: Every Module MUST Follow This Structure

```
src/tools/{module-name}/
├── index.jsx                    # Main component (<300 lines)
├── components/                  # Module-specific components
│   ├── {Module}ListView.jsx    # List/table view
│   ├── {Module}FormDialog.jsx  # Create/edit form
│   ├── FilterPanel.jsx          # Custom filters (if not using shared)
│   └── SettingsView.jsx         # Module settings (if applicable)
├── hooks/                       # Custom data hooks
│   ├── use{Module}.js           # Main CRUD hook
│   └── use{Module}Settings.js   # Settings hook (if applicable)
├── api.js                       # API client functions (optional)
└── utils/                       # Module-specific utilities (optional)
    └── {module}Helpers.js
```

**Violation = Inconsistent codebase**

---

### Rule 2: Main Component Responsibility

**index.jsx should ONLY**:
- Orchestrate sub-components
- Manage top-level state (active tab, dialogs open/closed)
- Handle routing/navigation within module
- Pass data from hooks to components

**index.jsx should NOT**:
- Render tables directly (use ListView component)
- Render forms directly (use FormDialog component)
- Contain business logic (use hooks/utils)
- Make API calls (use hooks)

**Size limit**: <300 lines

---

## 📦 Component Sizing Rules

| Component Type | Max Lines | If Larger, Split Into |
|----------------|-----------|----------------------|
| Main (index.jsx) | 300 | Tabs → Separate view components |
| ListView | 400 | Table → Separate component, Filters → FilterPanel |
| FormDialog | 500 | Form sections → Separate components |
| Settings | 300 | Setting groups → Separate tabs |
| Utility function | 100 | Extract to separate file in utils/ |

---

## 🔌 API Integration Pattern

### Option A: Using Generic useCRUD (Recommended)

```javascript
// src/tools/products/hooks/useProducts.js
import { useCRUD } from '@/hooks/useCRUD';

export function useProducts(organizationSlug) {
  const {
    items: products,
    loading,
    create: createProduct,
    update: updateProduct,
    delete: deleteProduct,
  } = useCRUD('products', organizationSlug);

  // Add module-specific logic here (if needed)
  const markAsOutOfStock = async (productId) => {
    await updateProduct(productId, { status: 'out_of_stock' });
  };

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    markAsOutOfStock,  // Custom method
  };
}
```

**When to use**: 90% of modules (standard CRUD operations)

---

### Option B: Custom Hook (Only if needed)

```javascript
// src/tools/strategic-map/hooks/useStrategicMap.js
// Use ONLY if module has non-standard data operations

import { useState, useEffect, useCallback } from 'react';

export function useStrategicMap(organizationSlug) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // Custom fetch logic (e.g., complex data structure)
  const fetchData = useCallback(async () => {
    // ... custom implementation
  }, [organizationSlug]);

  // Custom cascade logic
  const updateWithCascade = async (itemId, updates) => {
    // ... custom cascade implementation
  };

  return { data, loading, fetchData, updateWithCascade };
}
```

**When to use**: <10% of modules (special cases like Strategic Map with cascade logic)

---

## 🎨 Component Composition Pattern

### Bad: Monolithic Component

```jsx
// ❌ BAD - src/tools/products/index.jsx (2000+ lines)
export default function Products() {
  // 50 lines of state
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  // ... 30 more state variables

  // 500 lines of table rendering
  return (
    <div>
      <table>
        {/* Inline table with 20 columns, complex sorting, pagination */}
      </table>

      {/* 400 lines of inline form */}
      {isFormOpen && (
        <div>
          <input name="field1" />
          {/* 50 more fields */}
        </div>
      )}
    </div>
  );
}
```

**Problems**:
- Impossible to test individual parts
- Difficult to reuse logic
- Hard to understand

---

### Good: Modular Component

```jsx
// ✅ GOOD - src/tools/products/index.jsx (200 lines)
import { useState } from 'react';
import { useProducts } from './hooks/useProducts';
import ProductsListView from './components/ProductsListView';
import ProductFormDialog from './components/ProductFormDialog';
import SettingsView from './components/SettingsView';

export default function Products({ organizationSlug }) {
  const [activeTab, setActiveTab] = useState('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts(organizationSlug);

  const handleSave = async (productData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await createProduct(productData);
    }
    setIsFormOpen(false);
  };

  return (
    <div>
      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="list">Products</Tab>
        <Tab value="settings">Settings</Tab>
      </Tabs>

      {/* Content */}
      {activeTab === 'list' && (
        <ProductsListView
          products={products}
          loading={loading}
          onEdit={(product) => {
            setEditingProduct(product);
            setIsFormOpen(true);
          }}
          onDelete={deleteProduct}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView organizationSlug={organizationSlug} />
      )}

      {/* Form Dialog */}
      <ProductFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
        product={editingProduct}
      />
    </div>
  );
}
```

**Benefits**:
- Easy to test each component
- Can reuse ProductFormDialog elsewhere
- Clear separation of concerns

---

## 📁 File Naming Conventions

| File Type | Naming Pattern | Example |
|-----------|---------------|---------|
| Main component | `index.jsx` | `src/tools/products/index.jsx` |
| List view | `{Module}ListView.jsx` | `ProductsListView.jsx` |
| Form dialog | `{Module}FormDialog.jsx` | `ProductFormDialog.jsx` |
| Custom hook | `use{Module}.js` | `useProducts.js` |
| Settings hook | `use{Module}Settings.js` | `useProductSettings.js` |
| API client | `api.js` or `{module}API.js` | `productsAPI.js` |
| Utility | `{module}Helpers.js` | `productsHelpers.js` |

**Rules**:
- PascalCase for components (`.jsx`)
- camelCase for hooks/utilities (`.js`)
- Always singular for module name in file paths (`products/`, not `product/`)

---

## 🔄 Data Flow Pattern

```
User Action
  ↓
Component (ProductsListView)
  ↓
Event Handler (onEdit, onDelete)
  ↓
Main Component (index.jsx)
  ↓
Hook (useProducts)
  ↓
API Call (useCRUD → fetch)
  ↓
Backend (server/api_handlers/)
  ↓
Database (Supabase)
  ↓
Response
  ↓
Hook Updates State
  ↓
Component Re-renders
```

**Key Principle**: **Unidirectional data flow**

---

## 🧩 Module Independence Rules

### Rule: Modules Should NOT Import From Other Modules

```javascript
// ❌ BAD - Direct cross-module import
// src/tools/sales-management/components/CustomerSelector.jsx
import { getContacts } from '../../contact-management/api';  // ❌ Wrong!
```

```javascript
// ✅ GOOD - Use shared utilities or event system
// src/tools/sales-management/components/CustomerSelector.jsx
import { SearchableSelect } from '@/components/ui/searchable-select';

export function CustomerSelector({ organizationSlug }) {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Fetch via dedicated API endpoint
    fetch(`/api/contacts?organization_slug=${organizationSlug}&type=customer`)
      .then(res => res.json())
      .then(setCustomers);
  }, [organizationSlug]);

  return <SearchableSelect options={customers} />;
}
```

**Exception**: Modules can share data via:
1. Shared components (`src/components/ui/`)
2. Shared hooks (`src/hooks/`)
3. Shared utilities (`src/lib/`)
4. Event system (for real-time updates)

---

## 📊 Module Complexity Metrics

| Metric | Target | Red Flag |
|--------|--------|----------|
| Main file size | <300 lines | >500 lines |
| Number of components | 4-8 | >12 |
| Number of hooks | 2-5 | >8 |
| Cyclomatic complexity | <10 per function | >15 |
| Test coverage | >70% | <50% |
| Files in module | 10-20 | >30 |

**If Red Flag triggered**: Time to refactor.

---

## ✅ Refactoring Checklist

When refactoring a large component (>1000 lines):

### Phase 1: Extract Components (Week 1)
- [ ] Move table rendering → `{Module}ListView.jsx`
- [ ] Move form rendering → `{Module}FormDialog.jsx`
- [ ] Move filters → `FilterPanel.jsx` (or use shared)
- [ ] Move settings → `SettingsView.jsx`

### Phase 2: Extract Logic (Week 2)
- [ ] Move data fetching → `use{Module}.js` hook
- [ ] Move settings logic → `use{Module}Settings.js` hook
- [ ] Move utility functions → `utils/{module}Helpers.js`

### Phase 3: Test (Week 3)
- [ ] Write unit tests for hooks
- [ ] Write integration tests for components
- [ ] Test in dev environment
- [ ] Deploy to staging
- [ ] Get senior review

### Phase 4: Cleanup (Week 4)
- [ ] Delete old monolithic component
- [ ] Update imports across codebase
- [ ] Update documentation
- [ ] Deploy to production

---

## 📝 Module Template Generator (Future)

```bash
# Future CLI tool
npx create-module products

# Will generate:
src/tools/products/
├── index.jsx                  (✅ Created from template)
├── components/
│   ├── ProductsListView.jsx  (✅ Created)
│   └── ProductFormDialog.jsx (✅ Created)
└── hooks/
    └── useProducts.js        (✅ Created)

# Plus:
server/api_handlers/products.js  (✅ Created)
server/products_controller.js    (✅ Created)
docs/agents/products-agent.md    (✅ Created)
```

---

## 🎯 Examples of Good vs Bad Modules

### 🟢 Good Example: Contact Management

```
src/tools/contact-management/
├── index.jsx (236 lines) ✅
├── components/
│   ├── ContactListView.jsx ✅
│   ├── ContactFormDialog.jsx ✅
│   ├── ContactCard.jsx ✅
│   ├── SearchBar.jsx ✅
│   └── SettingsView.jsx ✅
├── hooks/
│   ├── useContacts.js ✅
│   ├── useContactStages.js ✅
│   ├── useTrafficChannels.js ✅
│   ├── useContactTags.js ✅
│   └── useContactSettings.js ✅
```

**Why Good**:
- Main file is small (236 lines)
- Clear component separation
- Each hook has single responsibility
- Easy to test and maintain

---

### 🔴 Bad Example: Inventory (Before Refactor)

```
src/tools/inventory/
└── index.jsx (2162 lines) ❌
```

**Why Bad**:
- All logic in one file
- Impossible to test individual features
- Difficult to onboard new developers
- High risk of merge conflicts

**Refactoring Plan**: Split into 8 files (~270 lines each)

---

## 📚 Related Documentation

- **Component Library**: `/docs/design-system/component-library.md`
- **API Design Pattern**: `/docs/patterns/api-design.md`
- **Database Schema**: `/docs/patterns/database-schema.md`
- **Project Cleanup**: `/docs/PROJECT_CLEANUP_GUIDE.md`

---

Last Updated: 2025-11-28
