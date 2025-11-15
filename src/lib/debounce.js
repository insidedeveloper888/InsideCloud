/**
 * Debounce Utility
 *
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 *
 * @example
 * const saveData = debounce((data) => {
 *   console.log('Saving:', data);
 * }, 500);
 *
 * saveData('hello'); // Will only execute 500ms after last call
 * saveData('world'); // Cancels previous, waits 500ms
 */
export function debounce(func, wait) {
  let timeout;

  const debounced = function (...args) {
    const context = this;

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };

  // Add cancel method to clear pending execution
  debounced.cancel = function () {
    clearTimeout(timeout);
  };

  return debounced;
}

export default debounce;
