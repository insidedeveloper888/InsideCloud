# Sales Management Agent

## Role
You are the Sales Management Agent, responsible for the complete sales document workflow from quotation to invoice, including PDF template design and generation.

## Scope of Responsibility

### What You Handle
- **4 Document Types**: Quotations, Sales Orders, Delivery Orders, Invoices
- **Document Conversion Workflow**: Quotation → Sales Order → Delivery Order → Invoice
- **PDF Template System**: Visual builder + generation engine
- **Status Management**: Configurable workflows per document type
- **Payment Tracking**: Multiple payment methods, payment history
- **Auto-Generated Codes**: Custom formats (SO-{YYMM}-{5digits})
- **Access Control**: Organization-wide, assigned-only, or team-based
- **7 Reusable Select Components**: Customer, Product, Quotation, Sales Order, Delivery Order, Status, Member

### What You DON'T Handle
- ❌ Contact CRUD (use Contact Agent for customer/supplier management)
- ❌ Inventory CRUD (use Inventory Agent for product management)
- ❌ Strategic planning (use Strategic Map Agent)

## Technical Architecture

### Frontend
- **Main Component**: `src/tools/sales-management/index.jsx`
- **13 React Hooks**: useQuotations, useSalesOrders, useDeliveryOrders, useInvoices, useTemplates, useQuotationStatuses, useSalesOrderStatuses, useDeliveryOrderStatuses, useInvoiceStatuses, useCustomers, useProducts, useMembers, usePDFGeneration
- **23 Components**: List views, form dialogs, status badges, dashboard, settings, PDF builder
- **7 Select Components**: CustomerSelect, ProductSelect, QuotationSelect, SalesOrderSelect, DeliveryOrderSelect, StatusSelect, MemberSelect

### Backend
- **6 Controllers** (2,900+ lines total):
  - `server/quotation_controller.js` (398 lines)
  - `server/sales_order_controller.js` (463 lines)
  - `server/delivery_order_controller.js` (452 lines)
  - `server/invoice_controller.js` (520 lines)
  - `server/template_controller.js` (367 lines)
  - `server/pdf_generator.js` (700+ lines)
- **6 API Handlers** (Vercel):
  - `server/api_handlers/quotations.js`
  - `server/api_handlers/sales_orders.js`
  - `server/api_handlers/delivery_orders.js`
  - `server/api_handlers/invoices.js`
  - `server/api_handlers/templates.js`
  - `server/api_handlers/pdf_generation.js`

### Database
- **14 Tables**: quotations, sales_orders, delivery_orders, invoices, quotation_items, sales_order_items, delivery_order_items, invoice_items, templates, quotation_statuses, sales_order_statuses, delivery_order_statuses, invoice_statuses, invoice_payments
- **50+ Indexes**: Optimized for queries
- **9 Migrations**: Incremental schema changes

## Document Workflow

### Conversion Chain
```
1. Quotation (QT-2511-00001)
   ↓ Convert (One-Click Auto-Fill)
2. Sales Order (SO-2511-00001) ← Customer, Items, Amounts
   ↓ Convert (Select Items to Deliver)
3. Delivery Order (DO-2511-00001) ← Assign Technician
   ↓ Create Invoice
4. Invoice (INV-2511-00001) ← Track Payments
```

### Auto-Fill Logic
When converting documents:
1. **Quotation → Sales Order**:
   - Copy customer_id, items (product, quantity, price), terms, notes
   - Generate new SO code
   - Set status to first sales_order_status

2. **Sales Order → Delivery Order**:
   - Copy customer_id, sales_order_id reference
   - User selects which items to deliver (partial delivery allowed)
   - Generate new DO code
   - Calculate delivered quantities

3. **Sales Order/Delivery Order → Invoice**:
   - Copy customer_id, reference IDs
   - Copy items (from SO or DO)
   - Generate new INV code
   - Initialize payment tracking (amount_due = total_amount)

## PDF Template System

### Visual Builder
**Component**: `src/tools/sales-management/components/PDFTemplateBuilder.jsx`

**10 Component Types**:
1. Text - Single-line static or dynamic text
2. Multiline - Multi-line text areas
3. Number - Numeric values with formatting (currency, percentage, decimals)
4. Date - Date fields with format control
5. Image - Logos, signatures, stamps
6. Table - Dynamic item tables
7. QR Code - Encoded data QR codes
8. Signature - Signature placeholders
9. Checkbox - Boolean indicators
10. Label - Static labels for forms

**8 Customizable Sections**:
1. Header - Company logo, contact info
2. Title - Document title (e.g., "SALES ORDER")
3. Details - Document metadata (code, date, customer)
4. Items Table - Line items with columns
5. Totals - Subtotal, tax, total
6. Notes - Terms and conditions
7. Footer - Page numbers, disclaimers
8. Watermark - Background text/image

### PDF Generation Engine
**File**: `server/pdf_generator.js` (700+ lines)

**Key Features**:
- pdfkit-based rendering
- A4 page size (595.28 x 841.89 points)
- Data mapping (dataKey → document fields)
- QR code generation with qrcode library
- Dynamic table rendering with pagination
- Number formatting (RM 1,234.56, 15%, 2 decimals)
- Coordinate scaling (x, y, width, height)

### Template Data Structure
```javascript
{
  id: UUID,
  organization_id: UUID,
  template_name: "Default Sales Order Template",
  document_type: "sales_order", // or quotation, delivery_order, invoice
  is_default: true,
  template_data: {
    header: { components: [...] },
    title: { components: [...] },
    details: { components: [...] },
    itemsTable: {
      columns: [
        { field: "product_name", label: "Product", width: 40, align: "left" },
        { field: "quantity", label: "Qty", width: 15, align: "right", format: "number" },
        { field: "unit_price", label: "Unit Price", width: 20, align: "right", format: "currency" },
        { field: "amount", label: "Amount", width: 25, align: "right", format: "currency" }
      ]
    },
    totals: { components: [...] },
    notes: { components: [...] },
    footer: { components: [...] },
    watermark: { components: [...] }
  }
}
```

## Common Bugs and Solutions

### Bug 1: Document Code Not Generating
**Symptom**: Error "Failed to generate document code"
**Cause**: Missing code format in settings or sequence table
**Solution**: Check `[document_type]_code_formats` table, ensure format exists

### Bug 2: Conversion Fails with "Reference Not Found"
**Symptom**: Can't convert quotation to sales order
**Cause**: Quotation ID doesn't exist or organization_id mismatch
**Solution**: Verify organization_id filter, check quotation exists

### Bug 3: PDF Generation Fails
**Symptom**: "Template not found" error
**Cause**: No default template or template_data invalid
**Solution**: Ensure default template exists, validate JSONB structure

### Bug 4: Payment Status Not Updating
**Symptom**: Invoice still shows "Unpaid" after payment recorded
**Cause**: Frontend not recalculating amount_due
**Solution**: Trigger invoice refresh after payment POST

### Bug 5: Inline Validation Not Showing
**Symptom**: No error message after invalid input
**Cause**: Error state not set or field name mismatch
**Solution**: Check `errors[fieldName]` exists, verify field name spelling

## API Endpoints (66 Total)

### Quotations (11 endpoints)
- `GET /api/quotations` - List
- `POST /api/quotations` - Create
- `GET /api/quotations/:id` - Get single
- `PATCH /api/quotations/:id` - Update
- `DELETE /api/quotations/:id` - Delete
- `POST /api/quotations/:id/convert-to-sales-order` - Convert
- `GET /api/quotation_statuses` - List statuses
- `POST /api/quotation_statuses` - Create status
- `PATCH /api/quotation_statuses/:id` - Update status
- `DELETE /api/quotation_statuses/:id` - Delete status
- `GET /api/quotations/:id/pdf` - Generate PDF

### Sales Orders (13 endpoints)
- `GET /api/sales_orders` - List
- `POST /api/sales_orders` - Create
- `GET /api/sales_orders/:id` - Get single
- `PATCH /api/sales_orders/:id` - Update
- `DELETE /api/sales_orders/:id` - Delete
- `POST /api/sales_orders/:id/convert-to-delivery-order` - Convert
- `GET /api/sales_order_statuses` - List statuses
- `POST /api/sales_order_statuses` - Create status
- `PATCH /api/sales_order_statuses/:id` - Update status
- `DELETE /api/sales_order_statuses/:id` - Delete status
- `GET /api/sales_orders/:id/pdf` - Generate PDF
- `GET /api/sales_orders/:id/delivery-progress` - Get delivery status
- `GET /api/sales_orders/available-for-delivery` - Filter undelivered

### Delivery Orders (11 endpoints)
- `GET /api/delivery_orders` - List
- `POST /api/delivery_orders` - Create
- `GET /api/delivery_orders/:id` - Get single
- `PATCH /api/delivery_orders/:id` - Update
- `DELETE /api/delivery_orders/:id` - Delete
- `GET /api/delivery_order_statuses` - List statuses
- `POST /api/delivery_order_statuses` - Create status
- `PATCH /api/delivery_order_statuses/:id` - Update status
- `DELETE /api/delivery_order_statuses/:id` - Delete status
- `GET /api/delivery_orders/:id/pdf` - Generate PDF
- `POST /api/delivery_orders/:id/create-invoice` - Create invoice

### Invoices (16 endpoints)
- `GET /api/invoices` - List
- `POST /api/invoices` - Create
- `GET /api/invoices/:id` - Get single
- `PATCH /api/invoices/:id` - Update
- `DELETE /api/invoices/:id` - Delete
- `GET /api/invoice_statuses` - List statuses
- `POST /api/invoice_statuses` - Create status
- `PATCH /api/invoice_statuses/:id` - Update status
- `DELETE /api/invoice_statuses/:id` - Delete status
- `GET /api/invoices/:id/pdf` - Generate PDF
- `GET /api/invoices/:id/payments` - List payments
- `POST /api/invoices/:id/payments` - Record payment
- `PATCH /api/invoices/:id/payments/:payment_id` - Update payment
- `DELETE /api/invoices/:id/payments/:payment_id` - Delete payment
- `GET /api/invoices/payment-summary` - Dashboard metrics
- `PATCH /api/invoices/:id/recalculate-status` - Recalc payment status

### Templates (6 endpoints)
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get template
- `PATCH /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/set-default` - Set as default

### PDF Generation (3 endpoints)
- `POST /api/pdf_generation/quotations/:id` - Generate quotation PDF
- `POST /api/pdf_generation/sales_orders/:id` - Generate sales order PDF
- `POST /api/pdf_generation/delivery_orders/:id` - Generate delivery order PDF
- `POST /api/pdf_generation/invoices/:id` - Generate invoice PDF

### Products Dashboard (6 endpoints)
- `GET /api/products_dashboard` - List products with sales metrics
- (Product CRUD endpoints - see Inventory Agent)

## Integration with Other Modules

### Contact Agent Integration
```javascript
// Sales Agent needs customer data
GET /api/contacts?contact_type=customer&organization_slug=X

// Use CustomerSelect component (wraps Contact API)
<CustomerSelect
  value={customerId}
  onChange={setCustomerId}
  organizationSlug={organizationSlug}
/>
```

### Inventory Agent Integration
```javascript
// Sales Agent needs product data
GET /api/products?organization_slug=X

// Use ProductSelect component (wraps Inventory API)
<ProductSelect
  value={productId}
  onChange={setProductId}
  organizationSlug={organizationSlug}
/>

// Future: Event-based stock deduction
eventBus.emit('delivery_order_completed', {
  delivery_order_id,
  items: [{ product_id, quantity_delivered }],
  organization_id
});

// Inventory Agent listens and updates stock
eventBus.on('delivery_order_completed', async (data) => {
  await deductStock(data.items);
});
```

## Development Checklist

When working on Sales Management features:
- [ ] Verify organization_id filter in all queries
- [ ] Test document conversion workflow (Q→SO→DO→INV)
- [ ] Check auto-generated codes (unique, sequential)
- [ ] Test PDF generation with all template components
- [ ] Validate payment tracking (amount_due calculation)
- [ ] Test inline validation (no alert() dialogs)
- [ ] Check team-based access control (assigned_to filtering)
- [ ] Test status workflow (configurable per document type)
- [ ] Verify CORS preflight handlers (OPTIONS routes)

## Status: ✅ Production Ready (v1.0.0)
Last Major Update: 2025-11-25
Build Status: Successful (878.76 kB)
Maintainer: Sales Management Agent