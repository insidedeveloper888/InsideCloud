# Sales Management Module - Comprehensive Test Plan

## 1. Overview

### 1.1 Module Scope
The Sales Management module handles the complete sales workflow from quotations to invoices, including:
- Quotations
- Sales Orders
- Delivery Orders
- Invoices
- Analytics & Reporting
- Settings & Configuration
- Team Management

### 1.2 Test Objectives
- Verify all CRUD operations work correctly
- Validate business logic and calculations
- Ensure proper data flow between documents
- Test multi-tenant isolation
- Verify role-based access control
- Validate analytics accuracy

---

## 2. Test Environment Setup

### 2.1 Prerequisites
- [ ] Database with test organization(s)
- [ ] Test users with different roles
- [ ] Sample products in inventory
- [ ] Sample customers in contacts
- [ ] Configured status workflows
- [ ] Sales teams set up (if enabled)

### 2.2 Test Data Requirements

**Organizations:**
- Org A: With sales teams enabled
- Org B: Without sales teams
- Org C: With custom status configurations

**Users:**
- Admin user
- Sales person (team member)
- Team lead
- Regular sales person (no team)

**Products:**
- At least 5 products with different categories
- Products with and without inventory tracking

**Customers:**
- At least 3 customer contacts

---

## 3. Functional Testing

### 3.1 Quotations Module

#### 3.1.1 Create Quotation
**Test Case ID:** QT-001  
**Priority:** High

**Steps:**
1. Navigate to Sales Management → Quotations
2. Click "New Quotation" button
3. Fill in required fields:
   - Customer (select from dropdown)
   - Quotation Date
   - Valid Until Date
   - Sales Person (optional)
4. Add line items:
   - Select product
   - Enter quantity
   - Verify unit price auto-fills
   - Add discount (percentage or amount)
5. Add notes (optional)
6. Click "Save as Draft"

**Expected Results:**
- ✅ Quotation code auto-generated (e.g., QT-2511-00001)
- ✅ Status set to "draft"
- ✅ Subtotal, tax, and total calculated correctly
- ✅ Quotation appears in list view
- ✅ Created by and created at fields populated

**Edge Cases:**
- Try saving without customer → Should show validation error
- Try saving without line items → Should show validation error
- Add 10+ line items → Should handle correctly
- Use very large quantities/prices → Should calculate correctly

---

#### 3.1.2 Edit Quotation
**Test Case ID:** QT-002  
**Priority:** High

**Steps:**
1. Open existing quotation
2. Click Edit button
3. Modify fields (customer, dates, line items)
4. Save changes

**Expected Results:**
- ✅ Changes saved successfully
- ✅ Updated at timestamp updated
- ✅ Updated by field populated
- ✅ Calculations recalculated if line items changed

**Edge Cases:**
- Edit quotation in "sent" status → Should allow
- Edit quotation in "accepted" status → Should allow
- Remove all line items → Should show validation error

---

#### 3.1.3 Convert Quotation to Sales Order
**Test Case ID:** QT-003  
**Priority:** High

**Steps:**
1. Open quotation in "accepted" status
2. Click "Convert to Sales Order" button
3. Verify conversion dialog
4. Confirm conversion

**Expected Results:**
- ✅ New sales order created
- ✅ Sales order code auto-generated
- ✅ All line items copied
- ✅ Customer and sales person copied
- ✅ Link maintained between quotation and sales order
- ✅ Quotation status remains "accepted"

---

#### 3.1.4 Status Workflow
**Test Case ID:** QT-004  
**Priority:** Medium

**Steps:**
1. Create quotation (draft status)
2. Change status to "sent"
3. Change status to "accepted"
4. Try changing back to "draft"

**Expected Results:**
- ✅ Status changes allowed based on configuration
- ✅ Status history tracked (if implemented)
- ✅ Custom statuses work (if configured)

---

### 3.2 Sales Orders Module

#### 3.2.1 Create Sales Order
**Test Case ID:** SO-001  
**Priority:** High

**Steps:**
1. Navigate to Sales Orders
2. Click "New Sales Order"
3. Fill in all required fields
4. Add line items
5. Save

**Expected Results:**
- ✅ Order code auto-generated (e.g., SO-2511-00001)
- ✅ All calculations correct
- ✅ Order appears in list
- ✅ Can be edited after creation

---

#### 3.2.2 Convert to Delivery Order
**Test Case ID:** SO-002  
**Priority:** High

**Steps:**
1. Open confirmed sales order
2. Click "Create Delivery Order"
3. Verify all items copied
4. Modify delivery details
5. Save delivery order

**Expected Results:**
- ✅ Delivery order created with all items
- ✅ DO code auto-generated
- ✅ Link maintained to sales order
- ✅ Delivery address copied from customer

---

#### 3.2.3 Partial Delivery
**Test Case ID:** SO-003  
**Priority:** Medium

**Steps:**
1. Create delivery order from sales order
2. Modify quantities (deliver only partial)
3. Save
4. Create another delivery order for remaining items

**Expected Results:**
- ✅ Multiple delivery orders can be created
- ✅ Quantities tracked correctly
- ✅ Sales order shows delivery status

---

### 3.3 Delivery Orders Module

#### 3.3.1 Create Delivery Order
**Test Case ID:** DO-001  
**Priority:** High

**Steps:**
1. Navigate to Delivery Orders
2. Create new delivery order
3. Fill in delivery details
4. Add items
5. Save

**Expected Results:**
- ✅ DO code auto-generated
- ✅ Delivery address fields available
- ✅ Tracking number field available
- ✅ Can link to sales order (optional)

---

#### 3.3.2 Convert to Invoice
**Test Case ID:** DO-002  
**Priority:** High

**Steps:**
1. Open delivered delivery order
2. Click "Create Invoice"
3. Verify all items and pricing copied
4. Add payment terms
5. Save invoice

**Expected Results:**
- ✅ Invoice created with all items
- ✅ Prices populated correctly
- ✅ Link maintained to delivery order
- ✅ Invoice code auto-generated

---

### 3.4 Invoices Module

#### 3.4.1 Create Invoice
**Test Case ID:** INV-001  
**Priority:** High

**Steps:**
1. Navigate to Invoices
2. Create new invoice
3. Fill in all fields
4. Add line items with pricing
5. Set payment terms and due date
6. Save

**Expected Results:**
- ✅ Invoice code auto-generated (e.g., INV-2511-00001)
- ✅ All financial calculations correct
- ✅ Amount due = total amount initially
- ✅ Can edit before sending

---

#### 3.4.2 Record Payment
**Test Case ID:** INV-002  
**Priority:** High

**Steps:**
1. Open sent invoice
2. Click "Record Payment"
3. Enter payment details:
   - Payment date
   - Amount
   - Payment method
   - Reference number
4. Save payment

**Expected Results:**
- ✅ Amount paid updated
- ✅ Amount due recalculated
- ✅ Payment appears in payment history
- ✅ Status changes to "partially_paid" or "paid"

---

#### 3.4.3 Partial Payment
**Test Case ID:** INV-003  
**Priority:** Medium

**Steps:**
1. Create invoice for RM 1000
2. Record payment of RM 300
3. Verify amount due = RM 700
4. Record another payment of RM 700
5. Verify invoice marked as paid

**Expected Results:**
- ✅ Multiple payments tracked correctly
- ✅ Amount due always accurate
- ✅ Status updates appropriately
- ✅ Cannot overpay (validation)

---

### 3.5 Analytics Dashboard

#### 3.5.1 Sales Trend Analytics
**Test Case ID:** AN-001  
**Priority:** High

**Steps:**
1. Navigate to Analytics tab
2. Select year filter
3. Verify "Sales Trend Analytics" chart shows all 12 months
4. Select specific month
5. Verify chart shows all days of that month

**Expected Results:**
- ✅ X-axis shows all 12 months when only year selected
- ✅ X-axis shows all days (1-30/31) when month selected
- ✅ Data points accurate
- ✅ Tooltips show correct values

---

#### 3.5.2 Sales Trend by Team
**Test Case ID:** AN-002  
**Priority:** High

**Steps:**
1. View "Sales Trend by Team" chart
2. Verify team filter dropdown appears
3. Select "All Teams"
4. Verify all team lines displayed
5. Select specific team
6. Verify only that team's line displayed

**Expected Results:**
- ✅ Filter dropdown shows all teams
- ✅ Chart updates when filter changes
- ✅ Team names display correctly (not "No Team")
- ✅ Legend shows team names
- ✅ Amounts calculated correctly

---

#### 3.5.3 Sales Trend by Sales Person
**Test Case ID:** AN-003  
**Priority:** High

**Steps:**
1. View "Sales Trend by Sales Person" chart
2. Test sales person filter
3. Verify filtering works correctly

**Expected Results:**
- ✅ Filter dropdown shows all sales persons
- ✅ Chart updates when filter changes
- ✅ Amounts accurate

---

#### 3.5.4 Product Analytics
**Test Case ID:** AN-004  
**Priority:** High

**Steps:**
1. View "Sales Quantity by Product" pie chart
2. Verify product names display (not "Unknown Product")
3. View "Sales Amount by Product" pie chart
4. Verify amounts calculated correctly

**Expected Results:**
- ✅ Pie charts display correctly
- ✅ Product names from inventory
- ✅ Quantities summed correctly
- ✅ Amounts summed correctly
- ✅ Legend shows product names
- ✅ Tooltips show values

---

#### 3.5.5 Top Performers
**Test Case ID:** AN-005  
**Priority:** Medium

**Steps:**
1. View "Top Sales Person" section
2. Verify names and amounts display
3. View "Top Sales Team" section
4. Verify team names and amounts

**Expected Results:**
- ✅ No "RMNan" displayed
- ✅ Amounts formatted as currency
- ✅ Top 10 displayed
- ✅ Sorted by amount (highest first)

---

### 3.6 Settings Module

#### 3.6.1 Document Code Format
**Test Case ID:** SET-001  
**Priority:** High

**Steps:**
1. Navigate to Settings
2. Configure quotation code format (e.g., "QT-{YYMM}-{5digits}")
3. Save settings
4. Create new quotation
5. Verify code follows format

**Expected Results:**
- ✅ Code generated according to format
- ✅ Counter increments correctly
- ✅ Resets based on period (monthly/yearly/never)

**Test Formats:**
- `QT-{YYMM}-{5digits}` → QT-2511-00001
- `SO-{YYYY}-{6digits}` → SO-2025-000001
- `{YY}{MM}{DD}-{4digits}` → 251124-0001

---

#### 3.6.2 Status Configuration
**Test Case ID:** SET-002  
**Priority:** High

**Steps:**
1. Navigate to Settings → Status Configuration
2. Add custom status for quotations
3. Set status properties (name, color, type)
4. Save
5. Create quotation and verify custom status available

**Expected Results:**
- ✅ Custom status appears in dropdown
- ✅ Color applied correctly
- ✅ Status type (draft/active/completed/cancelled) works
- ✅ Can reorder statuses
- ✅ Can delete unused statuses

---

#### 3.6.3 Sales Teams
**Test Case ID:** SET-003  
**Priority:** Medium

**Steps:**
1. Enable sales teams in settings
2. Navigate to Teams tab
3. Create new team
4. Add team members
5. Assign team lead
6. Verify team appears in filters

**Expected Results:**
- ✅ Team created successfully
- ✅ Members can be added/removed
- ✅ Team lead can be assigned
- ✅ Team appears in analytics filters
- ✅ Team-based visibility works (if configured)

---

#### 3.6.4 Tax Configuration
**Test Case ID:** SET-004  
**Priority:** Medium

**Steps:**
1. Set default tax rate (e.g., 6%)
2. Set tax inclusive/exclusive
3. Create new sales order
4. Verify tax calculated correctly

**Expected Results:**
- ✅ Tax rate applied to new documents
- ✅ Tax inclusive: total = subtotal (tax already included)
- ✅ Tax exclusive: total = subtotal + tax
- ✅ Can override tax on individual documents

---

### 3.7 Visibility & Permissions

#### 3.7.1 Organization-Wide Visibility
**Test Case ID:** VIS-001  
**Priority:** High

**Steps:**
1. Set visibility to "organization"
2. Login as User A
3. Create sales order
4. Login as User B (same org)
5. Verify User B can see User A's order

**Expected Results:**
- ✅ All users see all orders in organization

---

#### 3.7.2 Assigned Only Visibility
**Test Case ID:** VIS-002  
**Priority:** High

**Steps:**
1. Set visibility to "assigned_only"
2. Login as User A
3. Create sales order assigned to User A
4. Login as User B
5. Verify User B cannot see User A's order

**Expected Results:**
- ✅ Users only see orders assigned to them

---

#### 3.7.3 Team-Based Visibility
**Test Case ID:** VIS-003  
**Priority:** High

**Steps:**
1. Set visibility to "team_based"
2. Create Team X with User A (member) and User B (lead)
3. User A creates sales order
4. Login as User B
5. Verify User B can see User A's order
6. Login as User C (different team)
7. Verify User C cannot see the order

**Expected Results:**
- ✅ Team members see each other's orders
- ✅ Team leads see all team orders
- ✅ Other teams cannot see orders

---

## 4. Data Integrity Testing

### 4.1 Calculations
**Test Case ID:** CALC-001  
**Priority:** Critical

**Test Scenarios:**
1. Line item subtotal = quantity × unit_price - discount_amount
2. Document subtotal = sum of all line item subtotals
3. Tax amount = subtotal × tax_rate (if tax exclusive)
4. Total amount = subtotal + tax_amount - document_discount
5. Amount due = total_amount - amount_paid

**Validation:**
- Test with various quantities (0.5, 1, 100, 1000)
- Test with various prices (0.01, 10, 1000, 999999.99)
- Test with percentage discounts (0%, 10%, 50%, 100%)
- Test with amount discounts
- Test with different tax rates (0%, 6%, 10%)

---

### 4.2 Document Linking
**Test Case ID:** LINK-001  
**Priority:** High

**Steps:**
1. Create quotation → sales order → delivery order → invoice
2. Verify links maintained at each step
3. View quotation, check link to sales order
4. View sales order, check links to quotation, delivery orders, invoices
5. Delete delivery order
6. Verify sales order still exists (cascade delete not triggered)

**Expected Results:**
- ✅ All links maintained correctly
- ✅ Can navigate between linked documents
- ✅ Deleting child doesn't delete parent
- ✅ Soft delete preserves relationships

---

### 4.3 Multi-Tenant Isolation
**Test Case ID:** MT-001  
**Priority:** Critical

**Steps:**
1. Create sales order in Org A
2. Login to Org B
3. Try to access Org A's sales order (via direct URL if possible)
4. Verify access denied

**Expected Results:**
- ✅ Organizations cannot see each other's data
- ✅ API enforces organization_id filtering
- ✅ No data leakage between tenants

---

## 5. Edge Cases & Error Handling

### 5.1 Concurrent Editing
**Test Case ID:** EDGE-001  
**Priority:** Medium

**Steps:**
1. User A opens sales order for editing
2. User B opens same sales order for editing
3. User A saves changes
4. User B saves changes

**Expected Behavior:**
- Last save wins (User B's changes overwrite User A's)
- OR: Show conflict warning to User B

---

### 5.2 Large Data Sets
**Test Case ID:** EDGE-002  
**Priority:** Medium

**Test Scenarios:**
- Create document with 100 line items
- View list with 1000+ documents
- Generate analytics with 1 year of data (365 days)
- Filter large data sets

**Expected Results:**
- ✅ Performance remains acceptable (<3s load time)
- ✅ Pagination works correctly
- ✅ No browser crashes

---

### 5.3 Invalid Data
**Test Case ID:** EDGE-003  
**Priority:** High

**Test Scenarios:**
1. Negative quantities → Should show validation error
2. Negative prices → Should show validation error
3. Discount > 100% → Should show validation error
4. Future dates in past-only fields → Should validate
5. Invalid customer ID → Should show error
6. Deleted product in line item → Should handle gracefully

---

### 5.4 Status Constraints
**Test Case ID:** EDGE-004  
**Priority:** Critical

**Steps:**
1. Run SQL script to remove status check constraints
2. Configure custom status "approved"
3. Update sales order to "approved" status
4. Verify no database constraint error

**Expected Results:**
- ✅ Custom statuses work without database errors
- ✅ Application validates against configured statuses
- ✅ No hardcoded status restrictions

---

## 6. Performance Testing

### 6.1 Page Load Times
**Metrics:**
- List views: < 2 seconds
- Form dialogs: < 1 second
- Analytics dashboard: < 3 seconds
- Saving documents: < 2 seconds

### 6.2 API Response Times
**Metrics:**
- GET /api/sales_orders: < 500ms
- POST /api/sales_orders: < 1000ms
- GET /api/invoices (with items): < 800ms
- Analytics data fetch: < 2000ms

---

## 7. Browser Compatibility

### 7.1 Supported Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 7.2 Mobile Responsiveness
- [ ] Test on mobile devices (iOS/Android)
- [ ] Verify forms usable on small screens
- [ ] Check table scrolling on mobile

---

## 8. Regression Testing Checklist

After any code changes, verify:
- [ ] All CRUD operations still work
- [ ] Analytics charts display correctly
- [ ] Calculations remain accurate
- [ ] Document conversions work
- [ ] Filters and search function properly
- [ ] No console errors
- [ ] No broken links between documents

---

## 9. Acceptance Criteria

### 9.1 Must Have (Critical)
- ✅ All CRUD operations functional
- ✅ Calculations 100% accurate
- ✅ Multi-tenant isolation enforced
- ✅ No data loss
- ✅ Custom statuses work (after SQL script)

### 9.2 Should Have (High Priority)
- ✅ Analytics charts accurate
- ✅ Filters work correctly
- ✅ Document linking maintained
- ✅ Performance acceptable
- ✅ Team-based visibility works

### 9.3 Nice to Have (Medium Priority)
- ✅ Mobile responsive
- ✅ Export functionality
- ✅ Bulk operations
- ✅ Advanced search

---

## 10. Test Execution Tracking

### 10.1 Test Summary Template

| Test ID | Test Name | Status | Pass/Fail | Notes |
|---------|-----------|--------|-----------|-------|
| QT-001 | Create Quotation | ⏳ Not Run | - | - |
| QT-002 | Edit Quotation | ⏳ Not Run | - | - |
| SO-001 | Create Sales Order | ⏳ Not Run | - | - |
| ... | ... | ... | ... | ... |

### 10.2 Bug Tracking Template

| Bug ID | Severity | Description | Steps to Reproduce | Status |
|--------|----------|-------------|-------------------|---------|
| BUG-001 | High | ... | ... | Open |

---

## 11. Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Version:** _______________  
**Overall Status:** ⏳ Not Started / 🔄 In Progress / ✅ Passed / ❌ Failed

**Notes:**
_______________________________________
_______________________________________
