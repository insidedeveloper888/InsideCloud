/**
 * useProjectStatuses Hook
 * Manages project status CRUD operations and state
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useProjectStatuses(organizationSlug, individualId = null) {
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all statuses
  const refreshStatuses = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/project-statuses?organization_slug=${organizationSlug}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch statuses');
      }

      const data = await response.json();
      setStatuses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load statuses');
      console.error('Failed to fetch project statuses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  // Initial fetch
  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);

  // Create status
  const createStatus = useCallback(
    async (statusData) => {
      try {
        const response = await fetch(
          `${API_BASE}/project-statuses?organization_slug=${organizationSlug}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...statusData,
              organization_slug: organizationSlug,
              individual_id: individualId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create status');
        }

        const newStatus = await response.json();
        setStatuses((prev) => [...prev, newStatus]);
        return newStatus;
      } catch (err) {
        console.error('[useProjectStatuses] createStatus error:', err);
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  // Update status
  const updateStatus = useCallback(
    async (statusId, statusData) => {
      try {
        const response = await fetch(
          `${API_BASE}/project-statuses/${statusId}?organization_slug=${organizationSlug}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...statusData,
              organization_slug: organizationSlug,
              individual_id: individualId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update status');
        }

        const updatedStatus = await response.json();
        setStatuses((prev) =>
          prev.map((s) => (s.id === statusId ? updatedStatus : s))
        );
        return updatedStatus;
      } catch (err) {
        console.error('[useProjectStatuses] updateStatus error:', err);
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  // Delete status
  const deleteStatus = useCallback(
    async (statusId) => {
      try {
        const response = await fetch(
          `${API_BASE}/project-statuses/${statusId}?organization_slug=${organizationSlug}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete status');
        }

        setStatuses((prev) => prev.filter((s) => s.id !== statusId));
      } catch (err) {
        console.error('[useProjectStatuses] deleteStatus error:', err);
        throw err;
      }
    },
    [organizationSlug]
  );

  // Get default status
  const getDefaultStatus = useCallback(() => {
    return statuses.find((s) => s.is_default) || statuses[0] || null;
  }, [statuses]);

  return {
    statuses,
    isLoading,
    error,
    createStatus,
    updateStatus,
    deleteStatus,
    refreshStatuses,
    getDefaultStatus,
  };
}
