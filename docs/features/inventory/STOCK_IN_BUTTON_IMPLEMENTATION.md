# Stock In Button Implementation Guide

## Overview
This guide shows where to add the "Stock In" button for manual stock entries (refunds, returns, adjustments) in the Stock Overview tab.

## Current Structure

**File**: `src/tools/inventory/index.jsx`

### Existing Stock Out Flow
- Line 44: `showStockOutModal` state
- Line 461: `handleStockOut()` function
- Line 1088: Row click triggers Stock Out modal
- Line 1975: Stock Out Modal UI

## Visual Layout

### Before (Current)
```
┌─────────────────────────────────────────────────┐
│ Stock Overview Tab                              │
├─────────────────────────────────────────────────┤
│ SKU │ Name │ Category │ Location │ Qty │ Status │
├─────┼──────┼──────────┼──────────┼─────┼────────┤
│ A01 │ Cam1 │   CCTV   │  WH-A    │ 10  │   ●    │  ← Click row = Stock Out only
└─────────────────────────────────────────────────┘
```

### After (With Stock In/Out Buttons)
```
┌───────────────────────────────────────────────────────────┐
│ Stock Overview Tab                                        │
├───────────────────────────────────────────────────────────┤
│ SKU │ Name │ Category │ Location │ Qty │ Status │ Actions │
├─────┼──────┼──────────┼──────────┼─────┼────────┼─────────┤
│ A01 │ Cam1 │   CCTV   │  WH-A    │ 10  │   ●    │ [+][-]  │
└───────────────────────────────────────────────────────────┘
                                                      ↑   ↑
                                               Stock In  Stock Out
```

## Implementation Steps

### Step 1: Add State (after line 76)

```javascript
const [showStockInModal, setShowStockInModal] = useState(false);
const [stockInData, setStockInData] = useState({
  quantity: 0,
  unit_cost: 0,
  reference_type: 'manual',  // 'manual', 'return', 'refund', 'adjustment'
  notes: ''
});
```

### Step 2: Add Actions Column Header (around line 1067)

```javascript
<th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
  操作
</th>
```

### Step 3: Add Action Buttons in Table Row

```javascript
<td className="px-6 py-4 whitespace-nowrap text-sm">
  <div className="flex items-center justify-center space-x-2">
    {/* Stock In Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedStockItem(item);
        setShowStockInModal(true);
      }}
      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
      title="Stock In (入库)"
    >
      <Plus className="w-4 h-4" />
    </button>

    {/* Stock Out Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedStockItem(item);
        setShowStockOutModal(true);
      }}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Stock Out (出库)"
    >
      <Minus className="w-4 h-4" />
    </button>
  </div>
</td>
```

### Step 4: Add Handler Function (after handleStockOut)

```javascript
const handleStockIn = async () => {
  try {
    if (!selectedStockItem || stockInData.quantity <= 0) {
      setError('Invalid quantity');
      return;
    }

    const sessionData = JSON.parse(sessionStorage.getItem('lark_session') || '{}');
    const individualId = sessionData.individual_id;

    const movementPayload = {
      organization_slug: organizationSlug,
      product_id: selectedStockItem.product_id,
      location_id: selectedStockItem.location_id,
      movement_type: 'stock_in',
      quantity: parseFloat(stockInData.quantity),
      unit_cost: parseFloat(stockInData.unit_cost) || 0,
      reference_type: stockInData.reference_type,
      notes: stockInData.notes,
      created_by_individual_id: individualId
    };

    await InventoryAPI.createStockMovement(movementPayload);

    setShowStockInModal(false);
    setStockInData({ quantity: 0, unit_cost: 0, reference_type: 'manual', notes: '' });
    setSelectedStockItem(null);
    loadInventoryData();

  } catch (err) {
    console.error('Stock in error:', err);
    setError(err.message || 'Failed to stock in');
  }
};
```

### Step 5: Add Stock In Modal (after Stock Out Modal ~line 2050)

```javascript
{/* Stock In Modal */}
{showStockInModal && selectedStockItem && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border-2 border-emerald-200">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Plus className="w-6 h-6 text-emerald-600" />
            <span>Stock In (入库)</span>
          </h3>
          <button onClick={() => setShowStockInModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-4">
        {/* Product Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="font-bold text-gray-900">{selectedStockItem.product?.name}</div>
          <div className="text-sm text-gray-600">SKU: {selectedStockItem.product?.sku}</div>
          <div className="text-sm text-emerald-700 font-semibold mt-2">
            Current: {selectedStockItem.quantity} {selectedStockItem.product?.unit}
          </div>
        </div>

        {/* Reference Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Stock In Type *</label>
          <select
            value={stockInData.reference_type}
            onChange={(e) => setStockInData({ ...stockInData, reference_type: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
          >
            <option value="manual">Manual Entry (手动入库)</option>
            <option value="return">Customer Return (客户退货)</option>
            <option value="refund">Supplier Refund (供应商退款)</option>
            <option value="adjustment">Stock Adjustment (库存调整)</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
          <input
            type="number"
            min="0"
            value={stockInData.quantity}
            onChange={(e) => setStockInData({ ...stockInData, quantity: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
          />
        </div>

        {/* Unit Cost */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Cost (optional)</label>
          <input
            type="number"
            min="0"
            value={stockInData.unit_cost}
            onChange={(e) => setStockInData({ ...stockInData, unit_cost: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
          <textarea
            value={stockInData.notes}
            onChange={(e) => setStockInData({ ...stockInData, notes: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none"
            rows="2"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
        <button
          onClick={() => setShowStockInModal(false)}
          className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleStockIn}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold"
        >
          Confirm Stock In
        </button>
      </div>
    </div>
  </div>
)}
```

## Stock In Types

| Type | Use Case |
|------|----------|
| Manual Entry | General stock additions |
| Customer Return | Items returned by customers |
| Supplier Refund | Items returned from suppliers |
| Stock Adjustment | Inventory corrections/audits |

## Summary

1. **[+] Button** = Stock In (green) - Opens modal with type selection
2. **[-] Button** = Stock Out (red) - Existing functionality
3. User tracking automatic via `created_by_individual_id`
4. Shows in Stock Movements tab with user name
