import { useState, useEffect, useCallback } from 'react';

export function useInvoices(organizationSlug, filters = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!organizationSlug) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        ...filters,
      });

      const response = await fetch(`/api/invoices?${params}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug, JSON.stringify(filters)]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const createInvoice = async (invoiceData) => {
    try {
      const response = await fetch(`/api/invoices?organization_slug=${organizationSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const newInvoice = await response.json();
      await fetchInvoices();
      return newInvoice;
    } catch (err) {
      console.error('Error creating invoice:', err);
      throw err;
    }
  };

  const updateInvoice = async (id, invoiceData) => {
    try {
      const response = await fetch(`/api/invoices/${id}?organization_slug=${organizationSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update invoice');
      }

      const updatedInvoice = await response.json();
      await fetchInvoices();
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw err;
    }
  };

  const deleteInvoice = async (id) => {
    try {
      const response = await fetch(`/api/invoices/${id}?organization_slug=${organizationSlug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      await fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      throw err;
    }
  };

  const addPayment = async (id, paymentData) => {
    try {
      const response = await fetch(`/api/invoices/${id}/payments?organization_slug=${organizationSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add payment');
      }

      const payment = await response.json();
      await fetchInvoices();
      return payment;
    } catch (err) {
      console.error('Error adding payment:', err);
      throw err;
    }
  };

  const deletePayment = async (invoiceId, paymentId) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payments/${paymentId}?organization_slug=${organizationSlug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }

      await fetchInvoices();
    } catch (err) {
      console.error('Error deleting payment:', err);
      throw err;
    }
  };

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
    deletePayment,
  };
}
