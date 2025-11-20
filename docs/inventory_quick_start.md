# Inventory Quick Start Guide

## 🚀 Easiest Way to Add Inventory Data

Since you have a new organization with empty inventory, here's the **fastest way** to add data:

---

## **Method 1: Using Supabase SQL Editor** (Recommended - 2 minutes)

### **Step 1: Find Your Organization ID**

Go to Supabase → SQL Editor → Run this:

```sql
SELECT id, slug, name FROM organizations;
```

Copy your `id` (looks like: `a1b2c3d4-5678-90ab-cdef-1234567890ab`)

---

### **Step 2: One-Click Setup Script**

Copy this entire SQL script, **replace `YOUR_ORG_ID_HERE`** with your actual org ID, then paste and run in Supabase:

```sql
-- ============================================================================
-- QUICK SETUP: Inventory Test Data
-- Replace YOUR_ORG_ID_HERE with your actual organization ID
-- ============================================================================

-- 1. Create main warehouse location
INSERT INTO inventory_locations (organization_id, name, code, active)
VALUES ('YOUR_ORG_ID_HERE', '主仓库', 'MAIN', true)
ON CONFLICT (organization_id, code) DO NOTHING;

-- 2. Add sample products
INSERT INTO inventory_products (organization_id, sku, name, category, unit, description, active)
VALUES
  ('YOUR_ORG_ID_HERE', 'CCTV-1080P-001', '1080P 摄像头', 'CCTV', 'pcs', '高清监控摄像头', true),
  ('YOUR_ORG_ID_HERE', 'CCTV-4K-002', '4K 超清摄像头', 'CCTV', 'pcs', '4K高清摄像头带夜视', true),
  ('YOUR_ORG_ID_HERE', 'CCTV-PTZ-003', '云台摄像头', 'CCTV', 'pcs', '360度旋转云台摄像头', true),
  ('YOUR_ORG_ID_HERE', 'LED-STRIP-5M', 'LED灯带 5米', 'Lighting', 'pcs', '5米RGB灯带', true),
  ('YOUR_ORG_ID_HERE', 'LED-SPOT-001', 'LED射灯', 'Lighting', 'pcs', '嵌入式LED射灯', true),
  ('YOUR_ORG_ID_HERE', 'SPEAKER-CEIL-001', '吊顶扬声器', 'AV系统', 'pcs', '天花板嵌入式扬声器', true),
  ('YOUR_ORG_ID_HERE', 'SPEAKER-WALL-001', '壁挂音响', 'AV系统', 'pcs', '墙面安装音响', true),
  ('YOUR_ORG_ID_HERE', 'NVR-16CH', '16路NVR录像机', 'CCTV', 'pcs', '16路网络录像机', true),
  ('YOUR_ORG_ID_HERE', 'CABLE-CAT6', '超六类网线', '配件', 'meter', '305米/箱', true),
  ('YOUR_ORG_ID_HERE', 'SWITCH-24P', '24口交换机', '网络设备', 'pcs', '千兆交换机', true)
ON CONFLICT (organization_id, sku) DO NOTHING;

-- 3. Add stock quantities for all products
INSERT INTO inventory_stock_items (
  organization_id,
  product_id,
  location_id,
  quantity,
  reserved_quantity,
  average_cost,
  low_stock_threshold
)
SELECT
  p.organization_id,
  p.id,
  l.id,
  -- Set different quantities for variety
  CASE
    WHEN p.sku LIKE '%CCTV%' THEN 15
    WHEN p.sku LIKE '%LED%' THEN 25
    WHEN p.sku LIKE '%SPEAKER%' THEN 8
    WHEN p.sku LIKE '%NVR%' THEN 5
    WHEN p.sku LIKE '%CABLE%' THEN 50
    ELSE 10
  END as quantity,
  0 as reserved_quantity,
  -- Set different costs
  CASE
    WHEN p.sku LIKE '%4K%' THEN 320.00
    WHEN p.sku LIKE '%1080P%' THEN 180.00
    WHEN p.sku LIKE '%PTZ%' THEN 850.00
    WHEN p.sku LIKE '%LED-STRIP%' THEN 120.00
    WHEN p.sku LIKE '%LED-SPOT%' THEN 95.00
    WHEN p.sku LIKE '%SPEAKER-CEIL%' THEN 450.00
    WHEN p.sku LIKE '%SPEAKER-WALL%' THEN 380.00
    WHEN p.sku LIKE '%NVR%' THEN 650.00
    WHEN p.sku LIKE '%CABLE%' THEN 2.00
    WHEN p.sku LIKE '%SWITCH%' THEN 480.00
    ELSE 100.00
  END as average_cost,
  5 as low_stock_threshold
FROM inventory_products p
CROSS JOIN inventory_locations l
WHERE p.organization_id = 'YOUR_ORG_ID_HERE'
  AND l.organization_id = 'YOUR_ORG_ID_HERE'
  AND l.code = 'MAIN'
ON CONFLICT (organization_id, product_id, location_id) DO NOTHING;

-- 4. Add a test supplier
INSERT INTO inventory_suppliers (organization_id, name, contact_person, contact_email, contact_phone, active)
VALUES
  ('YOUR_ORG_ID_HERE', '安防科技有限公司', '张经理', 'zhang@security-tech.com', '+86 138-1234-5678', true),
  ('YOUR_ORG_ID_HERE', '光电供应商', '李先生', 'li@lighting-supply.com', '+86 139-8765-4321', true)
ON CONFLICT DO NOTHING;

-- 5. Add some movement history
INSERT INTO inventory_stock_movements (
  organization_id,
  product_id,
  location_id,
  movement_type,
  quantity,
  unit_cost,
  notes,
  occurred_at
)
SELECT
  p.organization_id,
  p.id,
  l.id,
  'stock_in',
  20,
  CASE
    WHEN p.sku LIKE '%4K%' THEN 320.00
    WHEN p.sku LIKE '%1080P%' THEN 180.00
    ELSE 100.00
  END,
  '初始入库',
  NOW() - INTERVAL '7 days'
FROM inventory_products p
CROSS JOIN inventory_locations l
WHERE p.organization_id = 'YOUR_ORG_ID_HERE'
  AND l.organization_id = 'YOUR_ORG_ID_HERE'
  AND l.code = 'MAIN'
LIMIT 5;

-- Success message
SELECT '✅ Test data created successfully!' AS result;
SELECT 'Go to your app and refresh the page!' AS next_step;
```

---

### **Step 3: Refresh Your App**

Go back to `http://localhost:3000` → Click "库存管理" → You should now see:

✅ **10 products** in inventory
✅ **Stats showing** total items, low stock alerts
✅ **Stock movements** history
✅ **Different categories**: CCTV, Lighting, AV系统, etc.

---

## **Method 2: Using Supabase Table Editor** (Visual, but slower)

### **Step 1: Add Products**

1. Go to Supabase → Table Editor → `inventory_products`
2. Click "Insert" → "Insert row"
3. Fill in:
   - `organization_id`: Your org ID
   - `sku`: "CCTV-001"
   - `name`: "1080P 摄像头"
   - `category`: "CCTV"
   - `unit`: "pcs"
   - `active`: true
4. Click Save
5. Repeat for more products

### **Step 2: Add Location**

1. Go to `inventory_locations` table
2. Insert row:
   - `organization_id`: Your org ID
   - `name`: "主仓库"
   - `code`: "MAIN"
   - `active`: true

### **Step 3: Add Stock Items**

1. Go to `inventory_stock_items` table
2. Insert row:
   - `organization_id`: Your org ID
   - `product_id`: (Select from dropdown)
   - `location_id`: (Select from dropdown)
   - `quantity`: 50
   - `average_cost`: 180.00
   - `low_stock_threshold`: 5

---

## **Method 3: Using API (For Developers)**

Coming soon - we'll add forms in the UI to do this directly!

---

## **What You Can Do Now**

### **✅ Currently Working:**
- ✅ **View inventory** - See all products with stock levels
- ✅ **View movements** - See stock IN/OUT history
- ✅ **Filter by status** - See low stock / out of stock items
- ✅ **Multi-location** - Track stock across warehouses
- ✅ **Stock status** - Auto-calculated (正常/低库存/缺货)

### **⏳ Coming Soon (Need UI Forms):**
- Add products via UI form
- Record stock IN/OUT via UI
- Manage purchase orders
- Search and filters
- Export to Excel

---

## **Quick Reference: Table Relationships**

```
organizations (your company)
    ↓
inventory_products (what you sell/use)
    ↓
inventory_stock_items (how many you have, where)
    ↓
inventory_stock_movements (history of IN/OUT)
```

---

## **Need More Help?**

### **Check Current Data:**

```sql
-- See all your products
SELECT * FROM inventory_products
WHERE organization_id = 'YOUR_ORG_ID_HERE';

-- See all stock items
SELECT
  p.sku,
  p.name,
  l.name as location,
  s.quantity,
  s.available_quantity
FROM inventory_stock_items s
JOIN inventory_products p ON p.id = s.product_id
JOIN inventory_locations l ON l.id = s.location_id
WHERE s.organization_id = 'YOUR_ORG_ID_HERE';

-- See movement history
SELECT
  m.occurred_at,
  m.movement_type,
  p.name,
  m.quantity,
  m.notes
FROM inventory_stock_movements m
JOIN inventory_products p ON p.id = m.product_id
WHERE m.organization_id = 'YOUR_ORG_ID_HERE'
ORDER BY m.occurred_at DESC
LIMIT 10;
```

### **Delete Test Data (If Needed):**

```sql
-- Clear all inventory data for your org
DELETE FROM inventory_stock_movements WHERE organization_id = 'YOUR_ORG_ID_HERE';
DELETE FROM inventory_stock_items WHERE organization_id = 'YOUR_ORG_ID_HERE';
DELETE FROM inventory_products WHERE organization_id = 'YOUR_ORG_ID_HERE';
DELETE FROM inventory_locations WHERE organization_id = 'YOUR_ORG_ID_HERE';
DELETE FROM inventory_suppliers WHERE organization_id = 'YOUR_ORG_ID_HERE';
```

---

**🎉 That's it! You now have a working inventory system!**

Next step: We can add UI forms to make adding/editing data easier without SQL.
