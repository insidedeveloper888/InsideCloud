# Stock In/Out with User Tracking

Complete guide for implementing user tracking in inventory movements and adding manual stock-in functionality.

## 🎯 Overview

### Current State
- ✅ Stock Out: Available in "Stock Overview" tab
- ✅ Purchase Orders: Auto-create stock-in when received
- ✅ User tracking field exists: `created_by_individual_id`
- ❌ No manual "Stock In" button for refunds/returns
- ❌ Stock Movements tab doesn't show WHO made the movement

### Target State
- ✅ Show user name in Stock Movements tab
- ✅ Manual "Stock In" button for various scenarios
- ✅ Track movement source (PO, refund, return, adjustment, etc.)
- ✅ Full audit trail with user attribution

---

## 📊 Database Changes

### Step 1: Run the SQL Script

Execute the following SQL in your Supabase SQL Editor:

```bash
Location: docs/sql-scripts/inventory/add_user_tracking_to_movements.sql
```

This script will:
1. ✅ Create a view `inventory_stock_movements_with_users` that joins movements with user data
2. ✅ Add indexes for better performance
3. ✅ Expand `reference_type` to support new types: `refund`, `return`, `transfer`, `adjustment`
4. ✅ Include user name, email, and Lark user ID in the view

### New Reference Types

| Type | Description | When to Use |
|------|-------------|-------------|
| `purchase_order` | Stock in from PO | Automatically created when PO is received |
| `manual` | Manual stock entry | Generic manual stock in/out |
| `return` | Customer return | Customer returned defective/unused items |
| `refund` | Return to supplier | Returning items to supplier for refund |
| `adjustment` | Stock adjustment | Inventory count correction, damage, loss |
| `transfer` | Location transfer | Moving stock between warehouses |
| `project` | Project usage | Items used in a project |

---

## 🎨 UI Changes Needed

### 1. Stock Movements Tab Enhancement

**Show User Information:**
```javascript
// Current: movements array from API
// New: Use inventory_stock_movements_with_users view

const columns = [
  { label: 'Date', key: 'occurred_at' },
  { label: 'Type', key: 'movement_type' },
  { label: 'Product', key: 'product_name' },
  { label: 'Quantity', key: 'quantity' },
  { label: 'Location', key: 'location_name' },
  { label: 'Source', key: 'reference_type_display' },  // New!
  { label: 'User', key: 'created_by_name' },           // New!
  { label: 'Notes', key: 'notes' }
];
```

**Display User Name:**
```javascript
// In the movement row
<td>
  {row.created_by_en_name || row.created_by_name || 'System'}
</td>
```

### 2. Add "Stock In" Button

**Location:** Stock Overview tab, next to existing "Stock Out" button

```jsx
{/* Add this next to Stock Out button */}
<button
  onClick={() => setShowStockInModal(true)}
  className="px-4 py-2 bg-green-600 text-white rounded-lg"
>
  <Plus className="w-4 h-4 mr-2" />
  Stock In
</button>
```

### 3. Stock In Modal

Create a new modal similar to Stock Out modal:

```jsx
const [showStockInModal, setShowStockInModal] = useState(false);
const [stockInData, setStockInData] = useState({
  product_id: '',
  location_id: '',
  quantity: 0,
  unit_cost: 0,
  reference_type: 'manual',  // Default
  notes: ''
});

// Reference type options
const stockInTypes = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'return', label: 'Customer Return' },
  { value: 'refund', label: 'Supplier Refund' },
  { value: 'adjustment', label: 'Stock Adjustment' }
];
```

**Modal Form Fields:**
1. **Product** (dropdown) - Required
2. **Location** (dropdown) - Required
3. **Quantity** (number) - Required
4. **Unit Cost** (number) - Optional
5. **Reason** (dropdown) - Required
   - Manual Entry
   - Customer Return
   - Supplier Refund
   - Stock Adjustment
6. **Notes** (textarea) - Optional

---

## 🔧 Backend API Changes

### Update Stock Movements Endpoint

**File:** `server/api_handlers/inventory.js`

```javascript
// Change the query to use the new view
async function getStockMovements(organizationSlug) {
  const { data, error } = await supabase
    .from('inventory_stock_movements_with_users')  // Changed!
    .select('*')
    .eq('organization_id', org.id)
    .order('occurred_at', { ascending: false });

  return data;
}
```

### Add Stock In Endpoint

```javascript
async function createStockIn(req, res) {
  const {
    product_id,
    location_id,
    quantity,
    unit_cost,
    reference_type,
    notes
  } = req.body;

  // Get user ID from session
  const individual_id = req.session?.individual_id;

  // Insert stock movement
  const { data, error } = await supabase
    .from('inventory_stock_movements')
    .insert({
      organization_id: org.id,
      product_id,
      location_id,
      movement_type: 'stock_in',
      quantity,
      unit_cost: unit_cost || 0,
      reference_type: reference_type || 'manual',
      notes,
      created_by_individual_id: individual_id,
      occurred_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  // Update stock item quantity
  await updateStockQuantity(product_id, location_id, quantity, unit_cost);

  return res.json({ success: true, data });
}
```

---

## 📱 Implementation Steps

### Phase 1: Database (Run SQL)
1. ✅ Execute `add_user_tracking_to_movements.sql` in Supabase
2. ✅ Verify view creation with test query
3. ✅ Test with existing movements

### Phase 2: Backend API
1. Update `getStockMovements()` to use new view
2. Add `createStockIn()` endpoint
3. Ensure user ID is captured from session

### Phase 3: Frontend UI
1. Update Stock Movements table to show user column
2. Add "Stock In" button to Stock Overview tab
3. Create Stock In modal form
4. Wire up API calls

### Phase 4: Testing
1. Test manual stock in with different reference types
2. Verify user name appears in movements
3. Test stock quantity updates correctly
4. Check multi-tenant isolation

---

## 🧪 Testing Scenarios

### Manual Stock In Tests

| Scenario | Reference Type | Expected Result |
|----------|---------------|-----------------|
| Customer returns defective camera | `return` | +1 qty, shows "Customer Return", user name |
| Supplier refunds overship | `refund` | +5 qty, shows "Refund", user name |
| Found missing items | `adjustment` | +3 qty, shows "Adjustment", user name |
| Generic stock in | `manual` | +10 qty, shows "Manual Entry", user name |

### User Attribution Tests

| Action | Expected User |
|--------|--------------|
| PO received | User who marked PO as received |
| Manual stock out | User who clicked "Stock Out" |
| Manual stock in | User who clicked "Stock In" |
| Stock adjustment | User who made adjustment |

---

## 📊 Example Queries

### Get movements with user info
```sql
SELECT
  occurred_at,
  movement_type,
  product_name,
  quantity,
  location_name,
  reference_type_display,
  COALESCE(created_by_en_name, created_by_name, 'System') as user,
  notes
FROM inventory_stock_movements_with_users
WHERE organization_id = '...'
ORDER BY occurred_at DESC
LIMIT 50;
```

### Stock movements by user
```sql
SELECT
  created_by_name,
  COUNT(*) as total_movements,
  SUM(CASE WHEN movement_type = 'stock_in' THEN 1 ELSE 0 END) as stock_ins,
  SUM(CASE WHEN movement_type = 'stock_out' THEN 1 ELSE 0 END) as stock_outs
FROM inventory_stock_movements_with_users
WHERE organization_id = '...'
  AND occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY created_by_name
ORDER BY total_movements DESC;
```

### Refunds in last 30 days
```sql
SELECT
  occurred_at,
  product_name,
  quantity,
  created_by_name,
  notes
FROM inventory_stock_movements_with_users
WHERE organization_id = '...'
  AND reference_type = 'refund'
  AND occurred_at >= NOW() - INTERVAL '30 days'
ORDER BY occurred_at DESC;
```

---

## 🚀 Quick Start

1. **Run SQL Script:**
   ```bash
   # In Supabase SQL Editor
   # Paste contents of: docs/sql-scripts/inventory/add_user_tracking_to_movements.sql
   # Execute
   ```

2. **Verify:**
   ```sql
   SELECT * FROM inventory_stock_movements_with_users LIMIT 5;
   ```

3. **Update Frontend API call:**
   ```javascript
   // Change from: inventory_stock_movements
   // To: inventory_stock_movements_with_users
   ```

4. **Add Stock In button** to Stock Overview tab

5. **Update movements table** to show user column

---

## 🔒 Security Considerations

1. **User Identification:**
   - Use `req.session.individual_id` from authenticated session
   - Never trust client-supplied user IDs
   - Fallback to NULL if user not identified

2. **Multi-Tenant Isolation:**
   - Always filter by `organization_id`
   - View automatically inherits RLS policies
   - Verify user belongs to organization

3. **Permissions:**
   - Only authenticated users can view movements
   - Only authorized users can create movements
   - Consider role-based access (admin vs regular user)

---

## 📝 Next Steps

1. Run the SQL script
2. Test user tracking in movements
3. Implement Stock In UI
4. Add comprehensive logging
5. Consider adding approval workflow for refunds

---

**Related Documentation:**
- [Purchase Order Flow](PURCHASE_ORDER_STATUS_FLOW.md)
- [Inventory Quick Start](inventory_quick_start.md)
- [Product Setup](INVENTORY_PRODUCT_SETUP.md)
