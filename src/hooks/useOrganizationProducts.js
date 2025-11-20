/**
 * useOrganizationProducts Hook
 *
 * Fetches and caches the list of products enabled for an organization.
 * Products are filtered by organization_product_access table on the backend.
 *
 * Usage:
 *   const { products, loading, error, refetch } = useOrganizationProducts(organizationSlug);
 *
 * Returns:
 *   - products: Array of product objects with { key, name, description, category, icon, metadata }
 *   - loading: Boolean indicating if data is being fetched
 *   - error: Error object if fetch failed
 *   - refetch: Function to manually refetch products
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || '';

// Cache products by organization slug to avoid redundant fetches
const productsCache = new Map();

export function useOrganizationProducts(organizationSlug) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    if (!organizationSlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    // Check cache first
    if (productsCache.has(organizationSlug)) {
      console.log(`📦 Using cached products for: ${organizationSlug}`);
      setProducts(productsCache.get(organizationSlug));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Fetching products for organization: ${organizationSlug}`);

      const response = await fetch(
        `${API_BASE}/api/products/dashboard?organization_slug=${organizationSlug}`,
        {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: 'Failed to fetch products' }));
        throw new Error(errorData.msg || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.code === 0 && data.data) {
        const productsList = data.data;
        console.log(`✅ Fetched ${productsList.length} products for: ${organizationSlug}`);

        // Cache the results
        productsCache.set(organizationSlug, productsList);
        setProducts(productsList);
      } else {
        throw new Error(data.msg || 'Invalid response format');
      }
    } catch (err) {
      console.error('❌ Error fetching organization products:', err);
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  // Fetch products when organization changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Refetch function to manually refresh products
  const refetch = useCallback(() => {
    // Clear cache for this organization
    if (organizationSlug) {
      productsCache.delete(organizationSlug);
    }
    fetchProducts();
  }, [organizationSlug, fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch,
  };
}

/**
 * Clear the entire products cache
 * Useful when logging out or switching users
 */
export function clearProductsCache() {
  productsCache.clear();
  console.log('🧹 Products cache cleared');
}

/**
 * Check if user has access to a specific product
 * This is a utility function that uses the cached products
 *
 * @param {string} organizationSlug - Organization slug
 * @param {string} productKey - Product key to check (e.g., 'strategic_map')
 * @returns {boolean} - True if product is enabled for organization
 */
export function hasProductAccess(organizationSlug, productKey) {
  if (!organizationSlug || !productKey) return false;

  const cachedProducts = productsCache.get(organizationSlug);
  if (!cachedProducts) return false;

  return cachedProducts.some((product) => product.key === productKey);
}
