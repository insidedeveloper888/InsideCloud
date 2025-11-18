/**
 * Parser for SQL Accounting "Supplier Document Listing"
 *
 * Expected structure:
 * - Row 1: Invoice headers
 * - Row 2+: Invoice rows, each followed by:
 *   - Item header row (Seq, Account Code, Description, Amount)
 *   - One or more item data rows
 *
 * Output: Combined rows with invoice data + item data
 * Final columns: Doc Date, Post Date, Doc No, Code, Company Name, Terms, Due Date, Description,
 *                Agent, Area, Currency Code, Currency Rate, Seq, Account Code, Item Description,
 *                Item Amount, Amount, Local Amount, Payment Amount, Cancelled, Doc Type, Project,
 *                From Doc Type, Ext. No, Company Category, Tax Exempt No., Journal, Tax Date
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
 * Invoice rows have "-" in column 0 and a date in column 1
 */
function isInvoiceRow(row) {
  if (!row || row.length < 2) return false;

  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').trim();

  // Invoice rows: "-" in column 0, date or doc no in column 1
  const hasMarker = col0 === '-';
  const hasData = col1.length > 0;

  return hasMarker && hasData;
}

/**
 * Main parser function
 * @param {Array<Array>} rawData - Excel data from XLSX library
 * @returns {Object} { headers, rows, metadata }
 */
export function parseSupplierInvoice(rawData) {
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
      while (paddedItem.length < 9) {
        paddedItem.push('');
      }

      // Create combined row based on the actual Excel structure
      // Invoice columns (from column 1): Doc Date(1), Post Date(3), Doc No(5), Code(6),
      //   Company Name(7), Terms(10), Due Date(11), Description(12), Agent(13), Area(14),
      //   Currency Code(15), Currency Rate(16), Amount(17), Local Amount(18), Payment Amount(19),
      //   Cancelled(20), Doc Type(21), Project(22), From Doc Type(23), Ext. No(24),
      //   Company Category(25), Tax Exempt No.(26), Journal(27), Tax Date(28)
      // Item columns (from column 1): Seq(1), Account Code(2), Description(4), Amount(8)
      //
      // Output order: Insert item columns between Currency Rate and Amount
      const combinedRow = {
        'Doc Date': formatDate(paddedInvoice[1]),
        'Post Date': formatDate(paddedInvoice[3]),
        'Doc No': paddedInvoice[5] || '',
        'Code': paddedInvoice[6] || '',
        'Company Name': paddedInvoice[7] || '',
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
        'Item Description': paddedItem[4] || '',
        'Item Amount': parseNumber(paddedItem[8]),
        // Resume invoice columns
        'Amount': parseNumber(paddedInvoice[17]),
        'Local Amount': parseNumber(paddedInvoice[18]),
        'Payment Amount': parseNumber(paddedInvoice[19]),
        'Cancelled': parseBoolean(paddedInvoice[20]),
        'Doc Type': paddedInvoice[21] || '',
        'Project': cleanPlaceholder(paddedInvoice[22]),
        'From Doc Type': paddedInvoice[23] || '',
        'Ext. No': paddedInvoice[24] || '',
        'Company Category': paddedInvoice[25] || '',
        'Tax Exempt No.': paddedInvoice[26] || '',
        'Journal': paddedInvoice[27] || '',
        'Tax Date': formatDate(paddedInvoice[28]),
      };

      combinedRows.push(combinedRow);
    }
  }

  if (combinedRows.length === 0) {
    throw new Error('Invalid file: No supplier invoice with item data found after parsing.');
  }

  // Step 4: Return structured result
  return {
    headers: Object.keys(combinedRows[0] || {}),
    rows: combinedRows,
    metadata: {
      totalRows: combinedRows.length,
      software: 'SQL Accounting',
      docType: 'Supplier Document Listing',
      parsedAt: new Date().toISOString(),
      originalRowCount: dataRows.length,
    }
  };
}
