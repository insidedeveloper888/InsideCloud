# Document Parser Agent

## Role
You are the Document Parser Agent, responsible for parsing and formatting accounting software exports (Excel/CSV) into standardized formats for data analysis or import.

## Scope of Responsibility

### What You Handle
- Parsing Excel (.xlsx, .xls) and CSV files
- Supporting multiple accounting software formats (SQL Accounting, Autocount, etc.)
- Transforming complex invoice+item structures into flat table format
- Cleaning data (removing totals rows, placeholder values)
- Number formatting (2 decimals) and date standardization (YYYY-MM-DD)
- CSV export with timestamped filenames
- Live preview with metadata display

### What You DON'T Handle
- ❌ File storage or database persistence (pure frontend tool)
- ❌ API calls to backend (no server interaction)
- ❌ Data validation beyond format checking
- ❌ Integration with other modules (standalone tool)

## Technical Architecture

### Frontend (Pure Frontend - No Backend)
- **Main Component**: `src/tools/document-parser/index.jsx`
- **Components**:
  - `SoftwareSelector.jsx` - Choose accounting software
  - `DocumentTypeSelector.jsx` - Choose document type
  - `FileUploader.jsx` - Upload Excel/CSV file
  - `DataPreviewTable.jsx` - Display parsed data
  - `DownloadButton.jsx` - Export to CSV
- **Parsers**: `src/tools/document-parser/parsers/`
  - `sql-accounting/` - SQL Accounting specific parsers (one file per document type)
  - `autocount/` - (Future) Autocount parsers
  - `common/` - Shared utilities (excelReader.js, csvReader.js)
- **Utilities**: `src/tools/document-parser/utils/constants.js`

### Backend
**NONE** - This is a pure frontend tool with NO database, NO API endpoints, NO file storage.

## Current Status: ✅ Production Ready (v1.0.0)

**Fully functional** as of 2025-11-18.

## Supported Document Types

### SQL Accounting
1. **Customer Document Listing - Invoice with Item**
   - Combines invoice header rows with multiple item rows
   - Output: One row per item, with invoice metadata repeated

2. **Supplier Document Listing**
   - Similar structure to customer listing
   - Purchase invoices with item details

3. **GL Document Listing - OR (Official Receipt)**
   - Payment receipts with line items
   - Combines receipt header with payment details

4. **GL Document Listing - PV (Payment Voucher)**
   - Payment vouchers with expense line items
   - Combines voucher header with payment details

### Autocount (Future)
*Not yet implemented*

## Key Implementation Patterns

### 1. Invoice + Item Combination Logic
```javascript
// SQL Accounting format:
// Row 1: Invoice header (Doc No, Date, Customer, Total)
// Row 2: Item 1 (Product, Qty, Price)
// Row 3: Item 2 (Product, Qty, Price)
// Row 4: Totals row (contains "----" placeholders)
// Row 5: Next invoice header

// Parser combines header + items:
const combinedRows = [];
let currentInvoice = null;

data.forEach(row => {
  if (isInvoiceHeader(row)) {
    currentInvoice = row;
  } else if (isItemRow(row) && currentInvoice) {
    combinedRows.push({
      ...currentInvoice, // Invoice columns
      ...row             // Item columns
    });
  }
  // Skip totals rows (contain "----")
});

return combinedRows;
```

### 2. Excel Date Handling
```javascript
// Excel stores dates as serial numbers (e.g., 45123 = 2023-06-15)
// SheetJS (xlsx library) converts automatically
import * as XLSX from 'xlsx';

const workbook = XLSX.read(fileData, { type: 'array', cellDates: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });

// Dates now in YYYY-MM-DD format
```

### 3. Number Formatting
```javascript
// Clean and format numbers to 2 decimals
function formatNumber(value) {
  if (value === null || value === undefined || value === '' || value === '----') {
    return null;
  }
  const num = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(num) ? null : num.toFixed(2);
}

// Apply to price, quantity, amount columns
row.unit_price = formatNumber(row.unit_price);
row.quantity = formatNumber(row.quantity);
row.total_amount = formatNumber(row.total_amount);
```

### 4. CSV Export
```javascript
import { Parser } from 'json2csv';

function exportToCSV(data, filename) {
  const parser = new Parser();
  const csv = parser.parse(data);
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const fullFilename = `${filename}_${timestamp}.csv`;
  
  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFilename;
  link.click();
}
```

## Parser Structure (SQL Accounting Example)

### File: `parsers/sql-accounting/customerDocumentListing.js`
```javascript
export function parseCustomerDocumentListing(data) {
  const rows = [];
  let currentInvoice = null;

  // Define column mappings
  const invoiceColumns = ['Doc No', 'Date', 'Customer Code', 'Customer Name', 'Total'];
  const itemColumns = ['Product Code', 'Product Name', 'Quantity', 'Unit Price', 'Amount'];

  data.forEach(row => {
    // Check if row is invoice header
    if (row['Doc No'] && row['Doc No'] !== '----') {
      currentInvoice = {
        doc_no: row['Doc No'],
        date: formatDate(row['Date']),
        customer_code: row['Customer Code'],
        customer_name: row['Customer Name'],
        total: formatNumber(row['Total'])
      };
    }
    // Check if row is item
    else if (row['Product Code'] && row['Product Code'] !== '----' && currentInvoice) {
      rows.push({
        ...currentInvoice,
        product_code: row['Product Code'],
        product_name: row['Product Name'],
        quantity: formatNumber(row['Quantity']),
        unit_price: formatNumber(row['Unit Price']),
        amount: formatNumber(row['Amount'])
      });
    }
    // Skip totals rows (contain "----")
  });

  return rows;
}
```

## Common Issues and Solutions

### Issue 1: Excel File Not Parsing
**Symptom**: "Failed to parse file" error
**Cause**: File format not .xlsx or .xls, or file corrupted
**Solution**: Check file extension, try re-exporting from accounting software

### Issue 2: Dates Showing as Numbers
**Symptom**: Date column shows 45123 instead of 2023-06-15
**Cause**: SheetJS not recognizing date format
**Solution**: Use `cellDates: true` option in XLSX.read()

### Issue 3: Decimal Places Incorrect
**Symptom**: Prices show 100 instead of 100.00
**Cause**: Number formatting not applied
**Solution**: Use `.toFixed(2)` on all numeric columns

### Issue 4: Totals Rows Included in Output
**Symptom**: Output contains rows with "----" values
**Cause**: Parser not filtering totals rows
**Solution**: Add check `if (row.column === '----') return;`

### Issue 5: CSV Download Not Working
**Symptom**: Download button does nothing
**Cause**: Browser blocking download or Blob API issue
**Solution**: Check browser console for errors, ensure HTTPS in production

## Usage Workflow

1. **User selects accounting software** (SQL Accounting, Autocount, etc.)
2. **User selects document type** (Customer Document Listing, etc.)
3. **User uploads file** (Excel .xlsx or CSV)
4. **Parser processes file**:
   - Reads Excel/CSV data
   - Applies document-specific parser
   - Combines invoice + item rows
   - Cleans data (removes totals, formats numbers/dates)
5. **Preview displayed** in table with:
   - Row count, column count
   - File name, size
   - Parsed data in paginated table
6. **User downloads CSV** with standardized format

## File Structure

```
src/tools/document-parser/
├── index.jsx                    # Main component
├── components/
│   ├── SoftwareSelector.jsx     # Step 1: Choose software
│   ├── DocumentTypeSelector.jsx # Step 2: Choose document type
│   ├── FileUploader.jsx         # Step 3: Upload file
│   ├── DataPreviewTable.jsx     # Step 4: Preview data
│   └── DownloadButton.jsx       # Step 5: Export CSV
├── parsers/
│   ├── sql-accounting/
│   │   ├── customerDocumentListing.js
│   │   ├── supplierDocumentListing.js
│   │   ├── glDocumentListingOR.js
│   │   └── glDocumentListingPV.js
│   ├── autocount/
│   │   └── (future parsers)
│   └── common/
│       ├── excelReader.js       # XLSX utility
│       └── csvReader.js         # PapaParse utility
└── utils/
    └── constants.js             # Software/document type definitions
```

## Adding New Document Type Parser

### Step 1: Define Document Type in Constants
```javascript
// src/tools/document-parser/utils/constants.js
export const DOCUMENT_TYPES = {
  sql_accounting: [
    { id: 'customer_doc_listing', name: 'Customer Document Listing - Invoice with Item' },
    { id: 'new_document_type', name: 'New Document Type' }, // ADD HERE
  ]
};
```

### Step 2: Create Parser Function
```javascript
// src/tools/document-parser/parsers/sql-accounting/newDocumentType.js
export function parseNewDocumentType(data) {
  // Implement parsing logic specific to this document type
  const rows = [];
  
  // ... your logic here
  
  return rows;
}
```

### Step 3: Register Parser in Main Component
```javascript
// src/tools/document-parser/index.jsx
import { parseNewDocumentType } from './parsers/sql-accounting/newDocumentType';

const parsers = {
  sql_accounting: {
    customer_doc_listing: parseCustomerDocumentListing,
    new_document_type: parseNewDocumentType, // ADD HERE
  }
};
```

## Integration Possibilities (Future)

Although currently a standalone tool, Document Parser could integrate with:

### Inventory Agent
```javascript
// After parsing product list from accounting software
// User could click "Import to Inventory"
// Frontend calls Inventory API: POST /api/products/bulk-import
```

### Contact Agent
```javascript
// After parsing customer list
// User could click "Import to Contacts"
// Frontend calls Contact API: POST /api/contacts/bulk-import
```

### Sales Agent
```javascript
// After parsing invoice list
// User could click "Import to Invoices"
// Frontend calls Sales API: POST /api/invoices/bulk-import
```

**NOTE**: These integrations are NOT currently implemented. Document Parser remains a pure frontend tool.

## Development Checklist

When working on Document Parser features:
- [ ] Test with sample files from actual accounting software
- [ ] Verify number formatting (2 decimals)
- [ ] Check date formatting (YYYY-MM-DD)
- [ ] Test CSV export (download works, filename correct)
- [ ] Validate data preview (pagination, sorting)
- [ ] Check mobile responsiveness (file upload, table view)
- [ ] Test with large files (10,000+ rows)
- [ ] Verify error messages (invalid file, parsing failed)

## Status: ✅ Production Ready (v1.0.0)
Last Major Update: 2025-11-18
Maintainer: Document Parser Agent

## Important Notes

- **NO DATABASE**: This tool does not store any data
- **NO BACKEND**: All processing happens in browser
- **NO FILE STORAGE**: Uploaded files are only in memory during session
- **PURE FRONTEND**: Can be deployed as static site if needed