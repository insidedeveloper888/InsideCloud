/**
 * API Client Utility with Product Access Control
 *
 * Provides a centralized fetch wrapper that handles:
 * - 403 Product Access Denied errors
 * - Automatic error notifications
 * - Cache invalidation on access changes
 */

import { clearProductsCache } from '../hooks/useOrganizationProducts';

/**
 * Product access denied error class
 */
export class ProductAccessDeniedError extends Error {
  constructor(message, product, organization) {
    super(message);
    this.name = 'ProductAccessDeniedError';
    this.product = product;
    this.organization = organization;
    this.statusCode = 403;
  }
}

/**
 * Global 403 error handlers
 * Components can register callbacks to be notified of access denied errors
 */
const accessDeniedHandlers = new Set();

export function onProductAccessDenied(handler) {
  accessDeniedHandlers.add(handler);
  return () => accessDeniedHandlers.delete(handler);
}

function notifyAccessDenied(error) {
  accessDeniedHandlers.forEach(handler => {
    try {
      handler(error);
    } catch (err) {
      console.error('Error in access denied handler:', err);
    }
  });
}

/**
 * Enhanced fetch wrapper with 403 handling
 *
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 * @throws {ProductAccessDeniedError} - When 403 access denied is detected
 */
export async function apiFetch(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  // Handle 403 Product Access Denied
  if (response.status === 403) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { msg: 'Access denied' };
    }

    // Check if this is a product access denial
    if (errorData.error === 'PRODUCT_ACCESS_DENIED') {
      const error = new ProductAccessDeniedError(
        errorData.msg || 'Access denied to this product',
        errorData.product,
        errorData.organization
      );

      console.error('🚫 Product Access Denied:', {
        product: errorData.product,
        organization: errorData.organization,
        message: errorData.msg,
      });

      // Clear products cache to force refresh
      clearProductsCache();

      // Notify registered handlers
      notifyAccessDenied(error);

      throw error;
    }
  }

  return response;
}

/**
 * Fetch JSON data with automatic error handling
 *
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Parsed JSON response
 */
export async function apiFetchJSON(url, options = {}) {
  const response = await apiFetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      msg: `HTTP ${response.status}`
    }));
    throw new Error(errorData.msg || `Request failed: ${response.status}`);
  }

  const data = await response.json();

  // Handle API error responses with code !== 0
  if (data.code !== undefined && data.code !== 0) {
    throw new Error(data.msg || 'API request failed');
  }

  return data;
}

/**
 * Default access denied handler - redirects to dashboard with error message
 * Can be used as a fallback handler
 */
export function defaultAccessDeniedHandler(error) {
  const message = `Access denied to ${error.product || 'product'}. Your organization may not have access to this feature.`;

  // Show alert
  alert(message);

  // Redirect to dashboard if we're in a browser environment
  if (typeof window !== 'undefined' && window.location) {
    // Remove hash navigation if present
    if (window.location.hash) {
      window.location.hash = '';
    }
  }
}
