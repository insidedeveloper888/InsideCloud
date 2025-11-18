import * as XLSX from 'xlsx';

/**
 * Read Excel file and convert to array of arrays
 * @param {File} file - Excel file object
 * @returns {Promise<Array<Array>>} - 2D array of data
 */
export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true, // Convert Excel dates to JS Date objects
          cellNF: false,
          cellText: false,
        });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Return array of arrays instead of objects
          raw: false, // Convert values to strings
          dateNF: 'yyyy-mm-dd', // Date format
          defval: '', // Default value for empty cells
        });

        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
