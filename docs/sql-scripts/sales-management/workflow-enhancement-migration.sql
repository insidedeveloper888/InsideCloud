-- ============================================================================
-- SALES WORKFLOW ENHANCEMENT - DATABASE MIGRATION (CORRECTED)
-- ============================================================================
-- Purpose: Add support for quotation-to-sales-order linking and delivery tracking
-- Version: 1.1.1
-- Date: 2025-11-23
-- ============================================================================

-- ============================================================================
-- PHASE 1: Add Quotation Link to Sales Orders
-- ============================================================================

-- Add source_quotation_id column to sales_orders table
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS source_quotation_id UUID REFERENCES sales_quotations(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_source_quotation 
ON sales_orders(source_quotation_id);

-- Add comment
COMMENT ON COLUMN sales_orders.source_quotation_id IS 'Reference to the quotation that was converted to this sales order';

-- ============================================================================
-- PHASE 2: Delivery Tracking Views
-- ============================================================================

-- Create view for delivery progress tracking
-- This view calculates how much of each sales order item has been delivered
CREATE OR REPLACE VIEW sales_order_delivery_progress AS
SELECT 
  so.id as sales_order_id,
  so.order_code,
  soi.id as sales_order_item_id,
  soi.product_id,
  soi.quantity as ordered_qty,
  COALESCE(SUM(doi.quantity), 0) as delivered_qty,
  soi.quantity - COALESCE(SUM(doi.quantity), 0) as remaining_qty,
  CASE 
    WHEN COALESCE(SUM(doi.quantity), 0) = 0 THEN 'not_delivered'
    WHEN COALESCE(SUM(doi.quantity), 0) >= soi.quantity THEN 'fully_delivered'
    ELSE 'partially_delivered'
  END as delivery_status,
  CASE 
    WHEN soi.quantity > 0 THEN 
      ROUND((COALESCE(SUM(doi.quantity), 0) / soi.quantity * 100)::numeric, 2)
    ELSE 0
  END as delivery_percentage
FROM sales_orders so
JOIN sales_order_items soi ON so.id = soi.sales_order_id
LEFT JOIN delivery_orders dord ON dord.sales_order_id = so.id AND dord.status != 'cancelled'
LEFT JOIN delivery_order_items doi ON doi.delivery_order_id = dord.id 
  AND doi.product_id = soi.product_id
WHERE so.is_deleted = FALSE
GROUP BY so.id, so.order_code, soi.id, soi.product_id, soi.quantity;

-- Create view for overall sales order delivery status
CREATE OR REPLACE VIEW sales_order_overall_delivery_status AS
SELECT 
  sales_order_id,
  order_code,
  SUM(ordered_qty) as total_ordered_qty,
  SUM(delivered_qty) as total_delivered_qty,
  SUM(remaining_qty) as total_remaining_qty,
  CASE 
    WHEN SUM(delivered_qty) = 0 THEN 'not_delivered'
    WHEN SUM(remaining_qty) = 0 THEN 'fully_delivered'
    ELSE 'partially_delivered'
  END as overall_delivery_status,
  CASE 
    WHEN SUM(ordered_qty) > 0 THEN 
      ROUND((SUM(delivered_qty) / SUM(ordered_qty) * 100)::numeric, 2)
    ELSE 0
  END as overall_delivery_percentage
FROM sales_order_delivery_progress
GROUP BY sales_order_id, order_code;

-- Add comments
COMMENT ON VIEW sales_order_delivery_progress IS 'Tracks delivery progress for each line item in sales orders';
COMMENT ON VIEW sales_order_overall_delivery_status IS 'Tracks overall delivery status for entire sales orders';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get delivery summary for a sales order
CREATE OR REPLACE FUNCTION get_sales_order_delivery_summary(p_sales_order_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  unit TEXT,
  ordered_qty NUMERIC,
  delivered_qty NUMERIC,
  remaining_qty NUMERIC,
  delivery_status TEXT,
  delivery_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sdp.product_id,
    p.name as product_name,
    p.sku as product_sku,
    p.unit,
    sdp.ordered_qty,
    sdp.delivered_qty,
    sdp.remaining_qty,
    sdp.delivery_status,
    sdp.delivery_percentage
  FROM sales_order_delivery_progress sdp
  JOIN inventory_products p ON p.id = sdp.product_id
  WHERE sdp.sales_order_id = p_sales_order_id
  ORDER BY sdp.sales_order_item_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate delivery quantities
CREATE OR REPLACE FUNCTION validate_delivery_quantities(
  p_sales_order_id UUID,
  p_items JSONB  -- Array of {product_id, quantity}
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_remaining NUMERIC;
  v_product_name TEXT;
BEGIN
  -- Loop through each item to validate
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    
    -- Get remaining quantity for this product
    SELECT 
      remaining_qty,
      (SELECT name FROM inventory_products WHERE id = sdp.product_id)
    INTO v_remaining, v_product_name
    FROM sales_order_delivery_progress sdp
    WHERE sdp.sales_order_id = p_sales_order_id
      AND sdp.product_id = v_product_id;
    
    -- Check if product exists in sales order
    IF v_remaining IS NULL THEN
      RETURN QUERY SELECT 
        FALSE, 
        format('Product "%s" is not in this sales order.', v_product_name);
      RETURN;
    END IF;
    
    -- Check if trying to deliver more than remaining
    IF v_quantity > v_remaining THEN
      RETURN QUERY SELECT 
        FALSE, 
        format('Cannot deliver %s units of "%s". Only %s units remaining.', 
          v_quantity, v_product_name, v_remaining);
      RETURN;
    END IF;
    
    -- Check if quantity is positive
    IF v_quantity <= 0 THEN
      RETURN QUERY SELECT 
        FALSE, 
        format('Quantity for "%s" must be greater than 0.', v_product_name);
      RETURN;
    END IF;
  END LOOP;
  
  -- All validations passed
  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if column was added
SELECT 
  table_name, 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'sales_orders'
  AND column_name = 'source_quotation_id';

-- Check if views were created
SELECT 
  table_name, 
  table_type
FROM information_schema.tables
WHERE table_name IN ('sales_order_delivery_progress', 'sales_order_overall_delivery_status')
ORDER BY table_name;

-- Check if functions were created
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_sales_order_delivery_summary', 'validate_delivery_quantities')
ORDER BY routine_name;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
