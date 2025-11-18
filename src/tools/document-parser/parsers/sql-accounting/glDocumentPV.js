/**
 * Parser for SQL Accounting "GL Document Listing - PV"
 *
 * Expected structure:
 * - Row 1: Main document headers
 * - Row 2+: Main document rows, each followed by:
 *   - Item header row (Account, Description, Project, Amount, Local Amount)
 *   - One or more item data rows
 *
 * Output: Combined rows with main document data + item data
 * Final columns: Doc Type, Doc No, Doc Date, Post Date, Journal, Description, Pay Code,
 *                Pay Method, Cheque No., Currency Code, Currency Rate, Bank Charge,
 *                Account, Item Description, Project, Item Amount, Item Local Amount,
 *                Doc Amount, Local Doc Amount, Cancelled, From Doc Type, Project (main),
 *                Agent, Area, Tax Date, Description 2, Print Count, Bank Charge Account,
 *                Bounced Date, Consolidate No.
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
 * Item headers have empty column 0 and "Account" in column 1
 */
function isItemHeaderRow(row) {
  if (!row || row.length < 4) return false;

  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').toLowerCase().trim();

  return (
    col0 === '' &&
    col1 === 'account'
  );
}

/**
 * Check if a row is a count/summary row
 * Count rows have a single number in column 1 (formatted as "Count = N" in Excel)
 */
function isCountRow(row) {
  if (!row || row.length < 2) return false;

  const col1 = String(row[1] || '').trim();

  // Check if column 1 is purely a number (the actual cell value before formatting)
  // This handles cells that are formatted to display as "Count = N" but contain just the number
  const isNumeric = !isNaN(col1) && col1 !== '' && !isNaN(parseFloat(col1));

  // Also check if it contains "count =" in case some rows have the text directly
  const hasCountText = col1.toLowerCase().includes('count =');

  return isNumeric || hasCountText;
}

/**
 * Check if a row is a main document row
 * Main rows have "-" in column 0 and "PV" (or doc type) in column 1
 */
function isMainRow(row) {
  if (!row || row.length < 2) return false;

  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').trim();

  // Main rows: "-" in column 0, Doc Type in column 1
  const hasMarker = col0 === '-';
  const hasDocType = col1.length > 0;

  return hasMarker && hasDocType;
}

/**
 * Main parser function
 * @param {Array<Array>} rawData - Excel data from XLSX library
 * @returns {Object} { headers, rows, metadata }
 */
export function parseGLDocumentPV(rawData) {
  // Step 1: Validate minimum structure
  if (!rawData || rawData.length < 2) {
    throw new Error('Invalid file: No data rows found. File must have at least a header row and one data row.');
  }

  // Step 2: Extract main document headers (Row 1)
  const mainHeaders = rawData[0];
  if (!mainHeaders || mainHeaders.length === 0) {
    throw new Error('Invalid file: Header row is missing or empty.');
  }

  // Step 3: Parse main and item rows
  const dataRows = rawData.slice(1); // Skip header
  const combinedRows = [];
  let currentMain = null;

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

    // Check if this is a count row (skip it)
    if (isCountRow(row)) {
      continue;
    }

    // Check if this is a main document row
    if (isMainRow(row)) {
      // Save current main document for item rows that follow
      currentMain = row;
    } else if (currentMain !== null) {
      // This is an item row - combine with current main document

      // Pad main row to ensure we have all columns
      const paddedMain = [...currentMain];
      while (paddedMain.length < 30) {
        paddedMain.push('');
      }

      // Pad item row to ensure we have all columns
      const paddedItem = [...row];
      while (paddedItem.length < 11) {
        paddedItem.push('');
      }

      // Create combined row based on the actual Excel structure
      // Main columns: Doc Type(1), Doc No(2), Doc Date(4), Post Date(5), Journal(7),
      //   Description(9), Pay Code(11), Pay Method(13), Cheque No.(14), Currency Code(15),
      //   Currency Rate(16), Bank Charge(17), Doc Amount(18), Local Doc Amount(19),
      //   Cancelled(20), From Doc Type(21), Project(22), Agent(23), Area(24),
      //   Tax Date(25), Description 2(26), Print Count(27), Bank Charge Account(28),
      //   Bounced Date(29), Consolidate No.(30)
      // Item columns: Account(1), Description(3), Project(6), Amount(8), Local Amount(10)
      //
      // Output order: Insert item columns between Bank Charge and Doc Amount
      const combinedRow = {
        'Doc Type': paddedMain[1] || '',
        'Doc No': paddedMain[2] || '',
        'Doc Date': formatDate(paddedMain[4]),
        'Post Date': formatDate(paddedMain[5]),
        'Journal': paddedMain[7] || '',
        'Description': paddedMain[9] || '',
        'Pay Code': paddedMain[11] || '',
        'Pay Method': paddedMain[13] || '',
        'Cheque No.': paddedMain[14] || '',
        'Currency Code': cleanPlaceholder(paddedMain[15]),
        'Currency Rate': cleanPlaceholder(paddedMain[16]),
        'Bank Charge': parseNumber(paddedMain[17]),
        // Item columns inserted here
        'Account': paddedItem[1] || '',
        'Item Description': paddedItem[3] || '',
        'Item Project': cleanPlaceholder(paddedItem[6]),
        'Item Amount': parseNumber(paddedItem[8]),
        'Item Local Amount': parseNumber(paddedItem[10]),
        // Resume main columns
        'Doc Amount': parseNumber(paddedMain[18]),
        'Local Doc Amount': parseNumber(paddedMain[19]),
        'Cancelled': parseBoolean(paddedMain[20]),
        'From Doc Type': paddedMain[21] || '',
        'Project': cleanPlaceholder(paddedMain[22]),
        'Agent': paddedMain[23] || '',
        'Area': cleanPlaceholder(paddedMain[24]),
        'Tax Date': formatDate(paddedMain[25]),
        'Description 2': paddedMain[26] || '',
        'Print Count': paddedMain[27] || '',
        'Bank Charge Account': paddedMain[28] || '',
        'Bounced Date': formatDate(paddedMain[29]),
        'Consolidate No.': paddedMain[30] || '',
      };

      combinedRows.push(combinedRow);
    }
  }

  if (combinedRows.length === 0) {
    throw new Error('Invalid file: No GL document with item data found after parsing.');
  }

  // Step 4: Return structured result
  return {
    headers: Object.keys(combinedRows[0] || {}),
    rows: combinedRows,
    metadata: {
      totalRows: combinedRows.length,
      software: 'SQL Accounting',
      docType: 'GL Document Listing - PV',
      parsedAt: new Date().toISOString(),
      originalRowCount: dataRows.length,
    }
  };
}
