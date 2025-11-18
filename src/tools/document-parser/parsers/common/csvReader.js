import Papa from 'papaparse';

/**
 * Read CSV file and convert to array of arrays
 * @param {File} file - CSV file object
 * @returns {Promise<Array<Array>>} - 2D array of data
 */
export function readCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`Failed to read CSV file: ${error.message}`));
      },
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all values as strings initially
    });
  });
}
