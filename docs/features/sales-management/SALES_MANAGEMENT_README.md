# Sales Management (销售管理) - Production Ready v1.0.0

**Status**: ✅ Production Ready (2025-11-25)
**Version**: 1.0.0
**Documentation**: See [CLAUDE.md](CLAUDE.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for comprehensive details

---

## Quick Overview

Complete sales document workflow from quotation to invoice with visual PDF template builder.

### Key Features
- 4 Document Types: Quotations, Sales Orders, Delivery Orders, Invoices
- Document conversion workflow with one-click auto-fill
- Visual PDF template builder with 10 component types
- PDF generation engine with data mapping and formatting
- Configurable status workflows per document type
- Payment tracking with multiple methods
- Auto-generated document codes (e.g., SO-{YYMM}-{5digits})
- Team-based access control
- 7 reusable select components
- Inline validation system

---

## Database Setup

### 1. Run Core Schema Migration

```sql
-- Execute in Supabase SQL Editor
\i docs/sql-scripts/sales-management/sales-management-complete-schema.sql
```

This creates:
- 14 tables (documents, settings, statuses, teams, templates)
- 50+ indexes
- Auto-update triggers

### 2. Run Additional Migrations (in order)

```sql
\i docs/sql-scripts/sales-management/setup_sales_product.sql
\i docs/sql-scripts/sales-management/003_refactor_to_sales_documents.sql
\i docs/sql-scripts/sales-management/004_delivery_orders_invoices.sql
\i docs/sql-scripts/sales-management/005_rename_delivery_order_sales_person_to_technician.sql
\i docs/sql-scripts/sales-management/006_document_templates.sql
```

### 3. Register Product

The product is automatically registered during `setup_sales_product.sql` execution.

---

## Backend Implementation

### Controllers (6 total, 2,900+ lines)
- `server/quotation_controller.js` (398 lines)
- `server/sales_order_controller.js`
- `server/delivery_order_controller.js` (398 lines)
- `server/invoice_controller.js` (577 lines)
- `server/template_controller.js`
- `server/pdf_generator.js` (700+ lines)

### API Endpoints (66 total)
- 16 Quotation endpoints
- 14 Sales Order endpoints
- 16 Delivery Order endpoints
- 20 Invoice endpoints (including payments)
- 9 Template endpoints
- 1 PDF generation endpoint

All endpoints registered in both:
- `server/server.js` (Koa development)
- `api/[...path].js` (Vercel production)

---

## Frontend Implementation

### Main Component
`src/tools/sales-management/index.jsx` - Main view with 4 tabs

### Hooks (13 total)
- useQuotations, useQuotationSettings, useQuotationStatuses
- useSalesOrders, useSalesSettings, useSalesOrderStatuses
- useDeliveryOrders, useDeliveryOrderSettings, useDeliveryOrderStatuses
- useInvoices, useInvoiceSettings, useInvoiceStatuses
- useTemplates

### Components (23 total)
**List Views**: QuotationsListView, SalesOrderListView, DeliveryOrderListView, InvoiceListView
**Form Dialogs**: QuotationFormDialog, SalesOrderFormDialog, DeliveryOrderFormDialog, InvoiceFormDialog, InvoicePaymentDialog
**Select Components**: CustomerSelect, ProductSelect, StatusSelect, MemberSelect, QuotationSelect, SalesOrderSelect, DeliveryOrderSelect
**Settings**: SettingsView, AnalyticsDashboard, StatusConfigurationPanel, TeamsView
**Templates**: 15 template components (builder, preview, editors, UI components)

---

## Document Workflow

```
Quotation (QT-2511-00001)
  ↓ Convert
Sales Order (SO-2511-00001) ← Auto-fill customer, items, amounts
  ↓ Convert
Delivery Order (DO-2511-00001) ← Select items to deliver, assign technician
  ↓ Create
Invoice (INV-2511-00001) ← Track payments, calculate amount due
```

---

## PDF Template System

### Visual Builder
- Full-screen modal editor with 3-pane layout
- Component library (left), canvas (center), properties (right)
- Live preview panel (toggle-able)
- Editable template name

### 10 Component Types
1. **Text** - Single-line dynamic text
2. **Multiline** - Multi-line text area
3. **Number** - Formatted numbers (currency, percentage)
4. **Date** - Formatted dates (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)
5. **Image** - Base64 images (logos)
6. **Table** - Dynamic tables with configurable columns
7. **QR Code** - Auto-generated QR codes
8. **Signature** - Signature lines
9. **Checkbox** - Boolean checkboxes
10. **Label** - Fixed text labels (NEW in v1.0.0)

### 8 Customizable Sections
1. Header (logo, company info, background)
2. Title (document title styling)
3. Document Details (invoice #, date, customer)
4. Items Table (line items styling)
5. Totals (totals section with grand total highlighting)
6. Notes (terms & conditions)
7. Footer (page numbers, footer text)
8. Watermark (DRAFT, PAID overlays)

---

## Build Status

```
✅ Build Successful
File sizes after gzip:
  906.83 kB (+8 B)  build/static/js/main.13608121.js
  20.67 kB          build/static/css/main.9c18ff8b.css

Only minor eslint warnings (unused variables)
Zero breaking errors
```

---

## Testing

### Backend API
```bash
# Start development server
npm run start:server

# Test quotation endpoint
curl "http://localhost:8989/api/quotations?organization_slug=YOUR_ORG_SLUG" \
  -H "Cookie: lk_token=YOUR_TOKEN"
```

### Frontend
```bash
# Start frontend
npm run start:web

# Navigate to:
# 1. Dashboard → Click "销售管理" (Sales Management)
# 2. Test tabs: Quotations, Sales Orders, Delivery Orders, Invoices
# 3. Go to Settings → Templates → Initialize default templates
```

---

## Future Enhancements

⏳ Pending:
- Add "Print" buttons to document list views
- Template selector dropdown before PDF download
- PDF preview dialog (optional)
- Analytics dashboard with charts

---

## Documentation

For complete details, see:
- **[CLAUDE.md](CLAUDE.md)** - Development guide, API patterns, deployment
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture decisions, change log, component standards
- **SQL Scripts**: `docs/sql-scripts/sales-management/` (9 migration files)

---

## Support

For questions or issues:
1. Check [CLAUDE.md](CLAUDE.md) for API implementation patterns
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for architecture decisions
3. Review SQL scripts in `docs/sql-scripts/sales-management/`
4. Check server logs (`npm run start:server`)
5. Check browser console for frontend errors

---

**Status**: Ready for production use 🚀
