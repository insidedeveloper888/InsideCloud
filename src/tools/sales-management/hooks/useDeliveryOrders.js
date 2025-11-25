import { useState, useEffect, useCallback } from 'react';

export function useDeliveryOrders(organizationSlug, filters = {}) {
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeliveryOrders = useCallback(async () => {
    if (!organizationSlug) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        ...filters,
      });

      const response = await fetch(`/api/delivery_orders?${params}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery orders');
      }

      const data = await response.json();
      setDeliveryOrders(data);
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug, JSON.stringify(filters)]);

  useEffect(() => {
    fetchDeliveryOrders();
  }, [fetchDeliveryOrders]);

  const createDeliveryOrder = async (orderData) => {
    try {
      const response = await fetch(`/api/delivery_orders?organization_slug=${organizationSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create delivery order');
      }

      const newOrder = await response.json();
      await fetchDeliveryOrders();
      return newOrder;
    } catch (err) {
      console.error('Error creating delivery order:', err);
      throw err;
    }
  };

  const updateDeliveryOrder = async (id, orderData) => {
    try {
      const response = await fetch(`/api/delivery_orders/${id}?organization_slug=${organizationSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update delivery order');
      }

      const updatedOrder = await response.json();
      await fetchDeliveryOrders();
      return updatedOrder;
    } catch (err) {
      console.error('Error updating delivery order:', err);
      throw err;
    }
  };

  const deleteDeliveryOrder = async (id) => {
    try {
      const response = await fetch(`/api/delivery_orders/${id}?organization_slug=${organizationSlug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete delivery order');
      }

      await fetchDeliveryOrders();
    } catch (err) {
      console.error('Error deleting delivery order:', err);
      throw err;
    }
  };

  const markDelivered = async (id) => {
    try {
      const response = await fetch(`/api/delivery_orders/${id}/mark-delivered?organization_slug=${organizationSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to mark delivery order as delivered');
      }

      const updatedOrder = await response.json();
      await fetchDeliveryOrders();
      return updatedOrder;
    } catch (err) {
      console.error('Error marking delivery order as delivered:', err);
      throw err;
    }
  };

  const getDeliveryOrder = useCallback(async (orderId) => {
    try {
      const response = await fetch(
        `/api/delivery_orders/${orderId}?organization_slug=${organizationSlug}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch delivery order');
      }

      const order = await response.json();
      return order;
    } catch (err) {
      console.error('Error fetching delivery order:', err);
      throw err;
    }
  }, [organizationSlug]);

  return {
    deliveryOrders,
    loading,
    error,
    fetchDeliveryOrders,
    createDeliveryOrder,
    updateDeliveryOrder,
    deleteDeliveryOrder,
    markDelivered,
    getDeliveryOrder,
  };
}
