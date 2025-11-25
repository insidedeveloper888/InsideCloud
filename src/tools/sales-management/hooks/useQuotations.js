import { useState, useEffect, useCallback } from 'react';

const resolveApiOrigin = () =>
  process.env.REACT_APP_API_ORIGIN || window.location.origin;

export function useQuotations(organizationSlug) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuotations = useCallback(async (filters = {}) => {
    if (!organizationSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ organization_slug: organizationSlug });

      // Add optional filters
      if (filters.status) params.append('status', filters.status);
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.sales_person_id) params.append('sales_person_id', filters.sales_person_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_quotations?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch quotations: ${response.statusText}`);
      }

      const data = await response.json();
      setQuotations(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  const createQuotation = useCallback(async (quotationData) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_quotations?organization_slug=${organizationSlug}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(quotationData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to create quotation');
      }

      const newQuotation = await response.json();
      setQuotations(prev => [newQuotation, ...prev]);
      return newQuotation;
    } catch (err) {
      console.error('Error creating quotation:', err);
      throw err;
    }
  }, [organizationSlug]);

  const updateQuotation = useCallback(async (quotationId, updates) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_quotations/${quotationId}?organization_slug=${organizationSlug}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update quotation');
      }

      const updatedQuotation = await response.json();
      setQuotations(prev =>
        prev.map(quotation => (quotation.id === quotationId ? updatedQuotation : quotation))
      );
      return updatedQuotation;
    } catch (err) {
      console.error('Error updating quotation:', err);
      throw err;
    }
  }, [organizationSlug]);

  const deleteQuotation = useCallback(async (quotationId) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_quotations/${quotationId}?organization_slug=${organizationSlug}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete quotation');
      }

      setQuotations(prev => prev.filter(quotation => quotation.id !== quotationId));
    } catch (err) {
      console.error('Error deleting quotation:', err);
      throw err;
    }
  }, [organizationSlug]);

  const getQuotation = useCallback(async (quotationId) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_quotations/${quotationId}?organization_slug=${organizationSlug}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quotation');
      }

      const quotation = await response.json();
      return quotation;
    } catch (err) {
      console.error('Error fetching quotation:', err);
      throw err;
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return {
    quotations,
    loading,
    error,
    refetch: fetchQuotations,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotation,
  };
}
