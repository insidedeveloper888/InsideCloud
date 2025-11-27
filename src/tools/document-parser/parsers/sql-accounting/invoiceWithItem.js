/**
 * Parser for SQL Accounting "Customer Document Listing - Invoice with Item"
 *
 * Expected structure:
 * - Row 1: Invoice headers
 * - Row 2+: Invoice rows, each followed by:
 *   - Item header row (Seq, Account Code, Description, Amount)
 *   - One or more item data rows
 *
 * Output: Combined rows with invoice data + item data
 * Final columns: Doc No, Doc Date, Post Date, Code, Company Name, Terms, Due Date, Description,
 *                Agent, Area, Currency, Seq, Account Code, Item Description, Item Amount,
 *                Amount, Local, Payment Amount, Cancelled, Project, From, Ext. No, Company,
 *                Tax Exempt, Journal, Tax Date
 */

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value);
}

/**
 * Clean placeholder values like "----"
 */
function cleanPlaceholder(value) {
  if (value === '----' || value === '' || value === null || value === undefined) {
    return '';
  }
  return value;
}

/**
 * Parse number values (handles comma formatting)
 * Returns string with 2 decimal places to preserve formatting
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return '0.00';
  if (typeof value === 'number') return value.toFixed(2);
  // Handle comma-formatted strings like "4,679.00"
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return '0.00';
    return parsed.toFixed(2);
  }
  return '0.00';
}

/**
 * Parse boolean values
 */
function parseBoolean(value) {
  if (value === 'True' || value === true || value === 'TRUE') return true;
  if (value === 'False' || value === false || value === 'FALSE') return false;
  return false;
}

/**
 * Check if a row is an item header row
 * Item headers have empty column 0 and "Seq" in column 1
 */
function isItemHeaderRow(row) {
  if (!row || row.length < 4) return false;

  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').toLowerCase().trim();
  const col2 = String(row[2] || '').toLowerCase().trim();

  return (
    col0 === '' &&
    col1 === 'seq' &&
    col2.includes('account')
  );
}

/**
 * Check if a row is an invoice row
 * Invoice rows have "-" in column 0 and Doc No (IV-XXXX-XXXX) in column 1
 */
function isInvoiceRow(row) {
  if (!row || row.length < 2) return false;

  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').trim();

  // Invoice rows: "-" in column 0, Doc No pattern in column 1
  const hasMarker = col0 === '-';
  const hasDocNo = /^[A-Z]+-\d+-\d+/.test(col1);

  return hasMarker && hasDocNo;
}

/**
 * Check if a row is a Sales Document parent row
 * Sales parent rows have "-" in column 0 and Doc No pattern in column 1
 */
function isSalesParentRow(row) {
  if (!row || row.length < 2) return false;
  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').trim();
  return col0 === '-' && /^[A-Z]+-\d+-\d+/.test(col1);
}

/**
 * Check if a row is a Sales Document item header row
 * Item headers have "Item Code" in column 1 or "Project" in column 2
 */
function isSalesItemHeaderRow(row) {
  if (!row || row.length < 4) return false;
  const col1 = String(row[1] || '').toLowerCase().trim();
  const col2 = String(row[2] || '').toLowerCase().trim();
  const col3 = String(row[3] || '').toLowerCase().trim();
  return col1 === 'item code' || col2 === 'project' || col3 === 'qty';
}

/**
 * Parse Sales Document Listing file
 * @param {Array<Array>} rawData - Excel data from XLSX library
 * @returns {Object} { invoiceMap: { docNo: { items: [] } } }
 */
function parseSalesDocument(rawData) {
  if (!rawData || rawData.length < 2) {
    throw new Error('Invalid Sales Document: No data found');
  }

  const dataRows = rawData.slice(1); // Skip header
  const invoiceMap = {};
  let currentDocNo = null;
  let currentItems = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    // Skip empty rows
    if (!row || row.every(cell => !cell)) continue;

    // Check if parent row
    if (isSalesParentRow(row)) {
      // Save previous invoice if exists
      if (currentDocNo && currentItems.length > 0) {
        invoiceMap[currentDocNo] = { items: currentItems };
      }
      
      // Start new invoice
      currentDocNo = row[1]; // Doc No in column B
      currentItems = [];
    }
    // Check if item header (skip)
    else if (isSalesItemHeaderRow(row)) {
      continue;
    }
    // Item row
    else if (currentDocNo) {
      // Sales Document structure (with merged cells):
      // Column A (0): "-" marker
      // Column B (1): Item Code
      // Column C-D (2-3): Project (merged, value at index 2)
      // Column E (4): Qty
      // Column F-G (5-6): UOM (merged, value at index 5)
      // Column H (7): SubTotal
      // Column I (8): From Doc No
      // Column J (9): From Doc Date
      
      const item = {
        itemCode: row[1] || '',
        project: row[2] || '',
        qty: parseNumber(row[4]),
        uom: row[5] || '',
        subTotal: parseNumber(row[7]),
        fromDocNo: row[8] || '',
        fromDocDate: formatDate(row[9]),
      };
      
      currentItems.push(item);
    }
  }

  // Save last invoice
  if (currentDocNo && currentItems.length > 0) {
    invoiceMap[currentDocNo] = { items: currentItems };
  }

  return { invoiceMap };
}

/**
 * Main parser function for dual-file parsing (Customer + Sales Documents)
 * @param {Array<Array>} customerData - Customer Document Listing data
 * @param {Array<Array>} salesData - Sales Document Listing data
 * @returns {Object} { headers, rows, metadata }
 */
export function parseInvoiceWithItemDual(customerData, salesData) {
  // Step 1: Validate inputs
  if (!customerData || customerData.length < 2) {
    throw new Error('Invalid Customer Document: No data rows found.');
  }
  if (!salesData || salesData.length < 2) {
    throw new Error('Invalid Sales Document: No data rows found.');
  }

  // Step 2: Parse Sales Document to create lookup map
  const salesResult = parseSalesDocument(salesData);
  const salesInvoiceMap = salesResult.invoiceMap;

  // Step 3: Parse Customer Document (similar to original parseInvoiceWithItem)
  const dataRows = customerData.slice(1); // Skip header
  const combinedRows = [];
  let currentInvoice = null;
  let currentInvoiceDocNo = null;
  let customerItemIndex = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    // Skip empty rows
    if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
      continue;
    }

    // Check if this is an item header row (skip it)
    if (isItemHeaderRow(row)) {
      continue;
    }

    // Check if this is an invoice row
    if (isInvoiceRow(row)) {
      // Save current invoice for item rows that follow
      currentInvoice = row;
      currentInvoiceDocNo = row[1]; // Doc No in column B
      customerItemIndex = 0; // Reset item counter for new invoice
    } else if (currentInvoice !== null) {
      // This is an item row - combine with current invoice and matching Sales data

      // Pad invoice row
      const paddedInvoice = [...currentInvoice];
      while (paddedInvoice.length < 28) {
        paddedInvoice.push('');
      }

      // Pad item row
      const paddedItem = [...row];
      while (paddedItem.length < 8) {
        paddedItem.push('');
      }

      // Look up matching Sales invoice
      const salesInvoice = salesInvoiceMap[currentInvoiceDocNo];
      const salesItem = salesInvoice?.items[customerItemIndex] || null;

      // Create combined row with Sales columns inserted after Currency Rate
      const combinedRow = {
        'Doc No': paddedInvoice[1] || '',
        'Doc Date': formatDate(paddedInvoice[4]),
        'Post Date': formatDate(paddedInvoice[5]),
        'Code': paddedInvoice[6] || '',
        'Company Name': paddedInvoice[8] || '',
        'Terms': paddedInvoice[10] || '',
        'Due Date': formatDate(paddedInvoice[11]),
        'Description': paddedInvoice[12] || '',
        'Agent': cleanPlaceholder(paddedInvoice[13]),
        'Area': cleanPlaceholder(paddedInvoice[14]),
        'Currency Code': cleanPlaceholder(paddedInvoice[15]),
        'Currency Rate': cleanPlaceholder(paddedInvoice[16]),
        // Sales item columns inserted here (7 columns)
        'Item Code': salesItem?.itemCode || '',
        'Project': salesItem?.project || '',
        'Qty': salesItem?.qty || '',
        'UOM': salesItem?.uom || '',
        'SubTotal': salesItem?.subTotal || '',
        'From Doc No': salesItem?.fromDocNo || '',
        'From Doc Date': salesItem?.fromDocDate || '',
        // Customer item columns
        'Seq': paddedItem[1] || '',
        'Account Code': paddedItem[2] || '',
        'Item Description': paddedItem[3] || '',
        'Item Amount': parseNumber(paddedItem[7]),
        // Resume invoice columns
        'Amount': parseNumber(paddedInvoice[17]),
        'Local': parseNumber(paddedInvoice[18]),
        'Payment Amount': parseNumber(paddedInvoice[19]),
        'Cancelled': parseBoolean(paddedInvoice[20]),
        'Project2': cleanPlaceholder(paddedInvoice[21]),
        'From': paddedInvoice[22] || '',
        'Ext. No': paddedInvoice[23] || '',
        'Company': paddedInvoice[24] || '',
        'Tax Exempt': paddedInvoice[25] || '',
        'Journal': paddedInvoice[26] || '',
        'Tax Date': formatDate(paddedInvoice[27]),
      };

      combinedRows.push(combinedRow);
      customerItemIndex++;
    }
  }

  if (combinedRows.length === 0) {
    throw new Error('Invalid files: No invoice with item data found after parsing.');
  }

  // Step 4: Calculate matching statistics
  const uniqueCustomerInvoices = new Set();
  combinedRows.forEach(row => uniqueCustomerInvoices.add(row['Doc No']));

  const matchedInvoices = Array.from(uniqueCustomerInvoices).filter(
    docNo => salesInvoiceMap[docNo]
  ).length;

  // Step 5: Return structured result
  return {
    headers: Object.keys(combinedRows[0] || {}),
    rows: combinedRows,
    metadata: {
      totalRows: combinedRows.length,
      customerInvoices: uniqueCustomerInvoices.size,
      salesInvoices: Object.keys(salesInvoiceMap).length,
      matchedInvoices: matchedInvoices,
      software: 'SQL Accounting',
      docType: 'Customer Document Listing - Invoice with Item (Dual)',
      parsedAt: new Date().toISOString(),
    }
  };
}

/**
 * Main parser function
 * @param {Array<Array>} rawData - Excel data from XLSX library
 * @returns {Object} { headers, rows, metadata }
 */
export function parseInvoiceWithItem(rawData) {
  // Step 1: Validate minimum structure
  if (!rawData || rawData.length < 2) {
    throw new Error('Invalid file: No data rows found. File must have at least a header row and one data row.');
  }

  // Step 2: Extract invoice headers (Row 1)
  const invoiceHeaders = rawData[0];
  if (!invoiceHeaders || invoiceHeaders.length === 0) {
    throw new Error('Invalid file: Header row is missing or empty.');
  }

  // Step 3: Parse invoice and item rows
  const dataRows = rawData.slice(1); // Skip header
  const combinedRows = [];
  let currentInvoice = null;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    // Skip empty rows
    if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
      continue;
    }

    // Check if this is an item header row (skip it)
    if (isItemHeaderRow(row)) {
      continue;
    }

    // Check if this is an invoice row
    if (isInvoiceRow(row)) {
      // Save current invoice for item rows that follow
      currentInvoice = row;
    } else if (currentInvoice !== null) {
      // This is an item row - combine with current invoice

      // Pad invoice row to ensure we have all columns
      const paddedInvoice = [...currentInvoice];
      while (paddedInvoice.length < 28) {
        paddedInvoice.push('');
      }

      // Pad item row to ensure we have all columns
      const paddedItem = [...row];
      while (paddedItem.length < 8) {
        paddedItem.push('');
      }

      // Create combined row based on the actual Excel structure
      // Invoice columns (from column 1): Doc No(1), Doc Date(4), Post Date(5), Code(6),
      //   Company Name(8), Terms(10), Due Date(11), Description(12), Agent(13), Area(14),
      //   Currency Code(15), Currency Rate(16), Amount(17), Local Amount(18), Payment Amount(19),
      //   Cancelled(20), Project(21), From Doc Type(22), Ext. No(23), Company Category(24),
      //   Tax Exempt No.(25), Journal(26), Tax Date(27)
      // Item columns (from column 1): Seq(1), Account Code(2), Description(3), Amount(7)
      //
      // Output order: Insert item columns between Currency and Amount
      const combinedRow = {
        'Doc No': paddedInvoice[1] || '',
        'Doc Date': formatDate(paddedInvoice[4]),
        'Post Date': formatDate(paddedInvoice[5]),
        'Code': paddedInvoice[6] || '',
        'Company Name': paddedInvoice[8] || '',
        'Terms': paddedInvoice[10] || '',
        'Due Date': formatDate(paddedInvoice[11]),
        'Description': paddedInvoice[12] || '',
        'Agent': cleanPlaceholder(paddedInvoice[13]),
        'Area': cleanPlaceholder(paddedInvoice[14]),
        'Currency Code': cleanPlaceholder(paddedInvoice[15]),
        'Currency Rate': cleanPlaceholder(paddedInvoice[16]),
        // Item columns inserted here
        'Seq': paddedItem[1] || '',
        'Account Code': paddedItem[2] || '',
        'Item Description': paddedItem[3] || '',
        'Item Amount': parseNumber(paddedItem[7]),
        // Resume invoice columns
        'Amount': parseNumber(paddedInvoice[17]),
        'Local': parseNumber(paddedInvoice[18]),
        'Payment Amount': parseNumber(paddedInvoice[19]),
        'Cancelled': parseBoolean(paddedInvoice[20]),
        'Project': cleanPlaceholder(paddedInvoice[21]),
        'From': paddedInvoice[22] || '',
        'Ext. No': paddedInvoice[23] || '',
        'Company': paddedInvoice[24] || '',
        'Tax Exempt': paddedInvoice[25] || '',
        'Journal': paddedInvoice[26] || '',
        'Tax Date': formatDate(paddedInvoice[27]),
      };

      combinedRows.push(combinedRow);
    }
  }

  if (combinedRows.length === 0) {
    throw new Error('Invalid file: No invoice with item data found after parsing.');
  }

  // Step 4: Return structured result
  return {
    headers: Object.keys(combinedRows[0] || {}),
    rows: combinedRows,
    metadata: {
      totalRows: combinedRows.length,
      software: 'SQL Accounting',
      docType: 'Customer Document Listing - Invoice with Item',
      parsedAt: new Date().toISOString(),
      originalRowCount: dataRows.length,
    }
  };
}
