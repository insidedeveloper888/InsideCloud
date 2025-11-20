# Purchase Order Status Flow & Inventory Management

## Status Flow Rules

### Valid Statuses
1. **draft** - PO is being created
2. **approved** - PO approved but not yet ordered
3. **ordered** - PO sent to supplier
4. **partially_received** - Some items received (future feature)
5. **received** - All items received ✅ **STOCK ADDED**
6. **cancelled** - PO cancelled

## Critical Business Rules

### ⚠️ Rule #1: No Reverting from "Received"
**Once a PO is marked as "Received", you CANNOT change it back to any other status.**

**Why?**
- When PO status → "Received", stock movements are created
- Inventory quantities are automatically updated
- Reverting the status would NOT reverse the stock (causing data corruption)

**Error Message:**
```
Cannot change status from "Received" back to another status.
Stock has already been added to inventory.
For returns or corrections, please use Stock Out movements or create a new adjustment.
```

## How to Handle Common Scenarios

### Scenario 1: Received Wrong Items / Damaged Goods
**Problem:** You marked PO as "Received" but some items were damaged.

**Solution:**
1. Keep PO status as "Received" (stock is already in system)
2. Go to **Stock Movements** tab
3. Create "Stock Out" movement for damaged items
4. Notes: "Damaged goods from PO-XXX - returning to supplier"
5. This properly reduces inventory

### Scenario 2: Supplier Refund / Return
**Problem:** Need to return items to supplier after receiving them.

**Solution:**
1. Keep PO status as "Received"
2. Create "Stock Out" movement for returned items
3. Notes: "Return to supplier [Supplier Name] - PO-XXX"
4. Create adjustment entry or new PO for replacement if needed

### Scenario 3: Accidental "Received" Status
**Problem:** Clicked "Received" by mistake, items not actually received yet.

**Solution - Option A (Recommended):**
1. Contact admin to manually adjust in database
2. Delete the stock movements created for this PO
3. Manually adjust stock quantities back
4. Change PO status in database directly

**Solution - Option B (Simpler):**
1. Create "Stock Out" movements to reverse the quantities
2. Notes: "Correction - PO-XXX items not actually received"
3. When items actually arrive, mark them as received again
4. This creates proper audit trail

### Scenario 4: Partial Delivery
**Problem:** Supplier only delivered 50 out of 100 items.

**Current Implementation:**
- Status "Received" adds ALL items from PO

**Workaround:**
1. Mark PO as "Received" (adds all 100 to stock)
2. Create "Stock Out" movement for the 50 not received yet
3. Notes: "Partial delivery - waiting for remaining 50 units"
4. When remaining items arrive, create "Stock In" movement

**Future Enhancement (Recommended):**
- Implement `partially_received` status properly
- Add `received_quantity` field to track partial deliveries
- Only add received quantities to stock

### Scenario 5: Cancelled PO After Receiving
**Problem:** Need to cancel a PO that was already received.

**Solution:**
1. You CANNOT cancel directly (status locked at "Received")
2. Create "Stock Out" movements to remove items from inventory
3. Notes: "Cancellation - full return to supplier PO-XXX"
4. Keep PO at "Received" status for audit trail
5. Alternatively, contact admin to manually handle in database

## Recommended Status Flow

```
┌──────────┐
│  Draft   │ ← Initial creation
└────┬─────┘
     │
     ▼
┌──────────┐
│ Approved │ ← Management approval
└────┬─────┘
     │
     ▼
┌──────────┐
│ Ordered  │ ← Sent to supplier
└────┬─────┘
     │
     ▼
┌────────────────────┐
│ Partially Received │ ← Some items arrived (future)
└─────────┬──────────┘
          │
          ▼
     ┌──────────┐
     │ Received │ ← ✅ STOCK ADDED - NO GOING BACK!
     └──────────┘
          │
          └─→ LOCKED (cannot change status)

┌──────────┐
│Cancelled │ ← Can cancel from any status EXCEPT "Received"
└──────────┘
```

## Best Practices

### ✅ DO:
1. **Double-check before marking as "Received"**
2. Use Stock Out movements for corrections
3. Add clear notes to all stock movements
4. Keep PO status as audit trail
5. Train staff on proper receiving procedures

### ❌ DON'T:
1. Mark as "Received" until items are physically verified
2. Try to revert "Received" status (system prevents this)
3. Delete stock movements manually (breaks audit trail)
4. Use "Received" status for testing (use draft/ordered instead)

## Future Enhancements

### 1. Partial Receiving System
```javascript
// Add to purchase_order_items table
received_quantity: number  // Track how much actually received
expected_quantity: number  // Original order quantity
```

### 2. Return/Refund Status
Add new statuses:
- `partially_returned` - Some items returned to supplier
- `fully_returned` - All items returned

### 3. Auto-Reverse Feature (Advanced)
```javascript
// If absolutely needed (not recommended)
async reverseReceivedPO(poId) {
  // 1. Fetch original stock movements
  // 2. Create reverse movements (stock_out)
  // 3. Update stock quantities
  // 4. Change PO status
  // WARNING: Complex and error-prone
}
```

### 4. Stock Adjustment Module
Dedicated UI for inventory corrections:
- Adjustment reason (damaged, theft, count correction, etc.)
- Approval workflow
- Automatic stock movement creation
- Better audit trail

## Database Audit Trail

Every action creates records:
```
inventory_stock_movements
├── reference_type: 'purchase_order'
├── reference_id: PO_ID
├── movement_type: 'stock_in' or 'stock_out'
├── notes: Reason for movement
└── occurred_at: Timestamp
```

This ensures complete traceability of all inventory changes.

## Summary

**The golden rule:** Once "Received", the PO status is locked. Use stock movements for all corrections and adjustments. This prevents inventory corruption and maintains data integrity.
