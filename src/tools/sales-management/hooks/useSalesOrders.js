import { useState, useEffect, useCallback } from 'react';

const resolveApiOrigin = () =>
  process.env.REACT_APP_API_ORIGIN || window.location.origin;

export function useSalesOrders(organizationSlug) {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSalesOrders = useCallback(async (filters = {}) => {
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
        `${resolveApiOrigin()}/api/sales_orders?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sales orders: ${response.statusText}`);
      }

      const data = await response.json();
      setSalesOrders(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sales orders:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  const createSalesOrder = useCallback(async (orderData) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_orders?organization_slug=${organizationSlug}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(orderData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to create sales order');
      }

      const newOrder = await response.json();
      setSalesOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      console.error('Error creating sales order:', err);
      throw err;
    }
  }, [organizationSlug]);

  const updateSalesOrder = useCallback(async (orderId, updates) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_orders/${orderId}?organization_slug=${organizationSlug}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update sales order');
      }

      const updatedOrder = await response.json();
      setSalesOrders(prev =>
        prev.map(order => (order.id === orderId ? updatedOrder : order))
      );
      return updatedOrder;
    } catch (err) {
      console.error('Error updating sales order:', err);
      throw err;
    }
  }, [organizationSlug]);

  const deleteSalesOrder = useCallback(async (orderId) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_orders/${orderId}?organization_slug=${organizationSlug}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete sales order');
      }

      setSalesOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Error deleting sales order:', err);
      throw err;
    }
  }, [organizationSlug]);

  const getSalesOrder = useCallback(async (orderId) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_orders/${orderId}?organization_slug=${organizationSlug}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sales order');
      }

      const order = await response.json();
      return order;
    } catch (err) {
      console.error('Error fetching sales order:', err);
      throw err;
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchSalesOrders();
  }, [fetchSalesOrders]);

  return {
    salesOrders,
    loading,
    error,
    refetch: fetchSalesOrders,
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
    getSalesOrder,
  };
}
