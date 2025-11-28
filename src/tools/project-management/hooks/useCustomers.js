/**
 * useCustomers Hook
 * Fetches customers (contacts with type 'customer') for project linking
 * Reuses Contact Management API
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useCustomers(organizationSlug) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch customers
  const refreshCustomers = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use Contact Management API with type filter
      const response = await fetch(
        `${API_BASE}/contacts?organization_slug=${organizationSlug}&contact_type=customer`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  // Initial fetch
  useEffect(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  // Get display name for a customer
  const getCustomerDisplayName = useCallback((customer) => {
    if (!customer) return '';
    if (customer.company_name) return customer.company_name;
    return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
  }, []);

  return {
    customers,
    isLoading,
    error,
    refreshCustomers,
    getCustomerDisplayName,
  };
}
