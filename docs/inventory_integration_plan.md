# Inventory Integration Plan - InsideCloud

## 📊 Schema Summary

### **Table Naming Convention (Improved)**

All inventory tables use `inventory_` prefix for clarity:

| Table Name | Purpose | Multi-Tenant Key |
|------------|---------|------------------|
| `inventory_products` | Product catalog (SKU, name, category) | `organization_id` |
| `inventory_locations` | Warehouses/storage locations | `organization_id` |
| `inventory_stock_items` | Stock quantities per location | `organization_id` |
| `inventory_stock_movements` | Transaction history (IN/OUT) | `organization_id` |
| `inventory_suppliers` | Supplier master data | `organization_id` |
| `inventory_supplier_prices` | Supplier pricing history | `organization_id` |
| `inventory_purchase_orders` | PO headers | `organization_id` |
| `inventory_purchase_order_items` | PO line items | (via PO header) |

### **Existing Tables (Unchanged)**

✅ `organizations` - Tenant root
✅ `individuals` - User accounts (with `lark_user_id`)
✅ `organization_members` - Membership mapping
✅ `strategic_map_items` - Strategic Map product
✅ `audit_events` - System audit log

---

## 🔒 Multi-Tenant Security Model

### **How Data Isolation Works**

```
User Login (Lark) → lark_user_id
                      ↓
            individuals table (find user)
                      ↓
         organization_members (which orgs?)
                      ↓
              organization_id filter
                      ↓
          inventory_products (only org's data)
```

### **Example Flow**

1. User logs in via Lark → `lark_user_id: "ou_12345"`
2. Backend finds `individual_id` from `lark_user_id`
3. Backend finds `organization_id` from `organization_members`
4. API queries: `WHERE organization_id = 'uuid-abc'`
5. User only sees their org's inventory

### **Security Layers**

| Layer | Implementation | Status |
|-------|---------------|--------|
| **API Validation** | Backend checks `organization_slug` | ✅ Already implemented |
| **SQL Filtering** | `WHERE organization_id = ?` | ✅ Will implement |
| **Row Level Security** | Supabase RLS policies | ⏳ Optional (later) |

**Recommendation**: Start with API-level filtering (like Strategic Map does), add RLS later for production hardening.

---

## 📁 Project Structure

```
InsideCloud/
├── docs/
│   └── migrations/
│       └── inventory_schema.sql          # ✅ Created - Run this in Supabase
│
├── src/products/inventory/               # 🆕 Create this
│   ├── index.jsx                         # Main inventory UI
│   ├── components/
│   │   ├── InventoryOverview.jsx        # Stock list with filters
│   │   ├── StockMovements.jsx           # Movement history
│   │   ├── PurchaseOrders.jsx           # PO management
│   │   ├── ProductForm.jsx              # Add/Edit product modal
│   │   └── MovementForm.jsx             # Stock IN/OUT form
│   ├── hooks/
│   │   └── useInventoryData.js          # Data fetching hook
│   └── api/
│       └── inventory.js                 # Client-side API helper
│
├── server/
│   ├── api_handlers/
│   │   └── inventory.js                 # 🆕 API endpoint handler
│   └── inventory_controller.js          # 🆕 Business logic controller
│
└── api/
    └── [...path].js                     # Register route here
```

---

## 🚀 Implementation Steps

### **Phase 1: Database Setup** (30 minutes)

1. Go to Supabase Dashboard → SQL Editor
2. Run: `/docs/migrations/inventory_schema.sql`
3. Verify tables created: Check Supabase → Table Editor
4. (Optional) Insert sample data for testing

**Verification**:
```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'inventory_%';

-- Should return 8 tables
```

---

### **Phase 2: Backend API** (2-3 hours)

#### **Step 2.1: Create Controller**
File: `server/inventory_controller.js`

**Key Methods**:
- `getInventoryItems(organizationSlug, filters)` - Get stock with product joins
- `getProducts(organizationSlug)` - Get product catalog
- `createProduct(organizationSlug, data)` - Add new product
- `updateInventoryQuantity(organizationSlug, itemId, qty)` - Adjust stock
- `getStockMovements(organizationSlug)` - Get movement history
- `createStockMovement(organizationSlug, data)` - Record IN/OUT
- `getPurchaseOrders(organizationSlug)` - Get POs
- `createPurchaseOrder(organizationSlug, data)` - Create PO

#### **Step 2.2: Create API Handler**
File: `server/api_handlers/inventory.js`

**Routes**:
```
GET  /api/inventory?organization_slug=xxx&type=items
GET  /api/inventory?organization_slug=xxx&type=products
GET  /api/inventory?organization_slug=xxx&type=movements
GET  /api/inventory?organization_slug=xxx&type=purchase-orders
POST /api/inventory (create product/movement/PO)
PUT  /api/inventory/:id (update stock quantity)
```

#### **Step 2.3: Register Routes**

**File 1**: `server/server.js`
```javascript
const inventory = require('./api_handlers/inventory');
router.all('/api/inventory', inventory);
router.all('/api/inventory/:id', inventory);
```

**File 2**: `api/[...path].js`
```javascript
const inventory = require('../server/api_handlers/inventory');
const routes = {
  // ... existing routes
  '/api/inventory': inventory,
};
```

---

### **Phase 3: Frontend Product** (3-4 hours)

#### **Step 3.1: Create Product Structure**
```bash
mkdir -p src/products/inventory/{components,hooks,api}
```

#### **Step 3.2: Create Files**

1. **`src/products/inventory/api/inventory.js`** - API client
2. **`src/products/inventory/index.jsx`** - Main UI with tabs
3. **`src/products/inventory/components/InventoryOverview.jsx`**
4. **`src/products/inventory/components/StockMovements.jsx`**
5. **`src/products/inventory/components/PurchaseOrders.jsx`**

#### **Step 3.3: Add to Dashboard**

File: `src/pages/home/index.js`

Add inventory card:
```javascript
<div
  className="bg-white rounded-3xl ... cursor-pointer"
  onClick={() => handleNavigate('inventory')}
>
  <div className="w-16 h-16 bg-primary-500 ...">
    {/* Warehouse icon */}
  </div>
  <h3>库存管理 (Inventory)</h3>
</div>
```

---

### **Phase 4: Copy UI from ProductPrototype** (2-3 hours)

Copy components from:
- `productprototype/src/pages/inventory/InventoryProcurement.jsx`

**Adaptations needed**:
1. Replace `useApp()` hook with `InventoryAPI` calls
2. Add `organizationSlug` context
3. Replace table names:
   - `inventory` → `inventory_stock_items`
   - `products` → `inventory_products`
   - `movements` → `inventory_stock_movements`
   - `purchaseOrders` → `inventory_purchase_orders`
4. Use InsideCloud's UI components (Tailwind + shadcn/ui)

---

## 📊 Data Flow Example

### **Viewing Inventory**

```
1. User clicks "库存管理" card
   ↓
2. Frontend: localStorage.getItem('organization_slug')
   ↓
3. Frontend: InventoryAPI.getItems(organizationSlug)
   ↓
4. Backend: GET /api/inventory?organization_slug=xyz&type=items
   ↓
5. Controller: getOrganizationInfo(organizationSlug) → org.id
   ↓
6. Supabase Query:
   SELECT * FROM inventory_stock_items
   JOIN inventory_products ON ...
   WHERE organization_id = 'uuid-abc'
   ↓
7. Response: { success: true, data: [...items] }
   ↓
8. Frontend: Render table with items
```

### **Adding Stock Movement**

```
1. User clicks "入库" (Stock In) button
   ↓
2. Modal: Select product, quantity, cost
   ↓
3. Frontend: InventoryAPI.createMovement(org, { movement_type: 'stock_in', ... })
   ↓
4. Backend: POST /api/inventory
   ↓
5. Controller:
   - INSERT INTO inventory_stock_movements
   - UPDATE inventory_stock_items SET quantity = quantity + X
   ↓
6. Response: { success: true, data: newMovement }
   ↓
7. Frontend: Refresh inventory list
```

---

## 🎯 Key Differences vs ProductPrototype

| Aspect | ProductPrototype | InsideCloud |
|--------|-----------------|-------------|
| **Data Storage** | Mock data (AppStore) | Supabase database |
| **Multi-Tenant** | Single org | Multi-org with `organization_id` |
| **Authentication** | None | Lark OAuth + `lark_user_id` |
| **Table Names** | `products`, `inventory` | `inventory_products`, `inventory_stock_items` |
| **API Pattern** | Direct Redux dispatch | RESTful API → Controller → Supabase |
| **Navigation** | React Router `/inventory` | Dashboard card → Product view |

---

## ✅ Checklist

### Phase 1: Database
- [ ] Run `inventory_schema.sql` in Supabase
- [ ] Verify 8 tables created
- [ ] Insert sample location/supplier (optional)

### Phase 2: Backend
- [ ] Create `server/inventory_controller.js`
- [ ] Create `server/api_handlers/inventory.js`
- [ ] Register routes in `server/server.js`
- [ ] Register routes in `api/[...path].js`
- [ ] Test API with Postman/curl

### Phase 3: Frontend Structure
- [ ] Create `src/products/inventory/` directory
- [ ] Create `api/inventory.js` (client helper)
- [ ] Create `index.jsx` (main UI)
- [ ] Create components (InventoryOverview, etc.)
- [ ] Add card to dashboard (`pages/home/index.js`)

### Phase 4: UI Implementation
- [ ] Copy UI from ProductPrototype
- [ ] Adapt for InsideCloud architecture
- [ ] Test CRUD operations
- [ ] Polish UI/UX

---

## 🔧 Next Steps

**Ready to start?**

1. **Run the SQL migration** - Go to Supabase and execute the schema
2. **Let me know when done** - I'll help you create the backend controller
3. **Then build the frontend** - Copy/adapt from ProductPrototype

**Questions?**
- Schema naming OK? ✅
- Security model clear? ✅
- Ready to implement? 🚀

---

**Generated**: 2025-11-19
**Status**: Planning Complete - Ready for Implementation
