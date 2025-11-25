/**
 * Order Code Generator Utility
 * Generates order codes from configurable format templates
 *
 * Supported tokens:
 * - {YYYY} - 4-digit year (2025)
 * - {YY} - 2-digit year (25)
 * - {MM} - 2-digit month (01-12)
 * - {DD} - 2-digit day (01-31)
 * - {YYMM} - Composite 2-digit year + 2-digit month (2512 for Dec 2025)
 * - {YYYYMM} - Composite 4-digit year + 2-digit month (202512 for Dec 2025)
 * - {MMYY} - Composite 2-digit month + 2-digit year (1225 for Dec 2025)
 * - {Xdigits} - X-digit counter with leading zeros (X = 1-10)
 *
 * Examples:
 * - 'SO-{YYMM}-{5digits}' + counter 1 → 'SO-2512-00001'
 * - 'INV-{YYYY}-{6digits}' + counter 42 → 'INV-2025-000042'
 * - '{YY}{MM}{DD}-{4digits}' + counter 123 → '251222-0123'
 */

/**
 * Generate order code from format template
 * @param {string} format - Format template (e.g., 'SO-{YYMM}-{5digits}')
 * @param {number} counter - Current counter value
 * @param {Date} date - Reference date for date tokens (defaults to now)
 * @returns {string} Generated order code
 */
function generateOrderCode(format, counter, date = new Date()) {
  if (!format) {
    throw new Error('Format template is required');
  }

  if (typeof counter !== 'number' || counter < 1) {
    throw new Error('Counter must be a positive number');
  }

  let code = format;

  // Extract date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Replace date tokens (order matters - do composite tokens first!)
  code = code.replace(/\{YYMM\}/g, String(year).slice(-2) + month);
  code = code.replace(/\{YYYYMM\}/g, String(year) + month);
  code = code.replace(/\{MMYY\}/g, month + String(year).slice(-2));
  code = code.replace(/\{YYYY\}/g, String(year));
  code = code.replace(/\{YY\}/g, String(year).slice(-2));
  code = code.replace(/\{MM\}/g, month);
  code = code.replace(/\{DD\}/g, day);

  // Replace digit tokens {Xdigits} where X is 1-10
  const digitPattern = /\{(\d+)digits\}/g;
  code = code.replace(digitPattern, (match, digitCount) => {
    const count = parseInt(digitCount, 10);
    if (count < 1 || count > 10) {
      throw new Error(`Invalid digit count: ${count}. Must be between 1 and 10.`);
    }
    return String(counter).padStart(count, '0');
  });

  return code;
}

/**
 * Check if counter should reset based on reset period
 * @param {string} resetPeriod - 'never', 'daily', 'monthly', 'yearly'
 * @param {Date|string} lastOrderDate - Last order creation date
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {boolean} True if counter should reset
 */
function shouldResetCounter(resetPeriod, lastOrderDate, currentDate = new Date()) {
  if (resetPeriod === 'never' || !lastOrderDate) {
    return false;
  }

  const last = new Date(lastOrderDate);
  const curr = new Date(currentDate);

  // Validate dates
  if (isNaN(last.getTime()) || isNaN(curr.getTime())) {
    return false;
  }

  switch (resetPeriod) {
    case 'daily':
      return last.toDateString() !== curr.toDateString();

    case 'monthly':
      return (
        last.getMonth() !== curr.getMonth() ||
        last.getFullYear() !== curr.getFullYear()
      );

    case 'yearly':
      return last.getFullYear() !== curr.getFullYear();

    default:
      return false;
  }
}

/**
 * Validate format template
 * @param {string} format - Format template to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
function validateFormat(format) {
  if (!format || typeof format !== 'string') {
    return { valid: false, error: 'Format must be a non-empty string' };
  }

  // Check if format contains at least one digit token
  const hasDigitToken = /\{\d+digits\}/.test(format);
  if (!hasDigitToken) {
    return {
      valid: false,
      error: 'Format must contain at least one {Xdigits} token (e.g., {5digits})',
    };
  }

  // Validate digit token range (1-10)
  const digitMatches = format.match(/\{(\d+)digits\}/g);
  if (digitMatches) {
    for (const match of digitMatches) {
      const count = parseInt(match.match(/\{(\d+)digits\}/)[1], 10);
      if (count < 1 || count > 10) {
        return {
          valid: false,
          error: `Invalid digit count in ${match}. Must be between 1 and 10.`,
        };
      }
    }
  }

  return { valid: true, error: null };
}

/**
 * Preview format with sample data
 * @param {string} format - Format template
 * @param {number} sampleCounter - Sample counter (defaults to 1)
 * @param {Date} sampleDate - Sample date (defaults to now)
 * @returns {object} { success: boolean, preview: string, error: string|null }
 */
function previewFormat(format, sampleCounter = 1, sampleDate = new Date()) {
  const validation = validateFormat(format);
  if (!validation.valid) {
    return { success: false, preview: null, error: validation.error };
  }

  try {
    const preview = generateOrderCode(format, sampleCounter, sampleDate);
    return { success: true, preview, error: null };
  } catch (error) {
    return { success: false, preview: null, error: error.message };
  }
}

/**
 * Get next counter value (with auto-reset logic)
 * @param {number} currentCounter - Current counter value
 * @param {string} resetPeriod - Reset period setting
 * @param {Date|string} lastOrderDate - Last order date
 * @param {Date} currentDate - Current date
 * @returns {number} Next counter value
 */
function getNextCounter(currentCounter, resetPeriod, lastOrderDate, currentDate = new Date()) {
  if (shouldResetCounter(resetPeriod, lastOrderDate, currentDate)) {
    return 1; // Reset to 1
  }
  return currentCounter + 1;
}

module.exports = {
  generateOrderCode,
  shouldResetCounter,
  validateFormat,
  previewFormat,
  getNextCounter,
};
