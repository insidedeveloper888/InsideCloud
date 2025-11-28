/**
 * useProjectMembers Hook
 * Manages project member assignments (add/remove members)
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useProjectMembers(projectId, organizationSlug) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch project members
  const refreshMembers = useCallback(async () => {
    if (!projectId || !organizationSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/projects/${projectId}/members?organization_slug=${organizationSlug}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch project members');
      }

      const data = await response.json();
      setMembers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load project members');
      console.error('Failed to fetch project members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, organizationSlug]);

  // Initial fetch
  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  // Add member to project
  const addMember = useCallback(
    async (individualId, role = 'member') => {
      if (!projectId || !organizationSlug) return;

      try {
        const response = await fetch(
          `${API_BASE}/projects/${projectId}/members?organization_slug=${organizationSlug}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              organization_slug: organizationSlug,
              member_individual_id: individualId,
              role,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to add member');
        }

        const newMember = await response.json();
        setMembers((prev) => [...prev, newMember]);
        return newMember;
      } catch (err) {
        console.error('Failed to add project member:', err);
        setError(err.message || 'Failed to add member');
        throw err;
      }
    },
    [projectId, organizationSlug]
  );

  // Remove member from project
  const removeMember = useCallback(
    async (individualId) => {
      if (!projectId || !organizationSlug) return;

      try {
        const response = await fetch(
          `${API_BASE}/projects/${projectId}/members/${individualId}?organization_slug=${organizationSlug}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to remove member');
        }

        setMembers((prev) => prev.filter((m) => m.individual_id !== individualId));
      } catch (err) {
        console.error('Failed to remove project member:', err);
        setError(err.message || 'Failed to remove member');
        throw err;
      }
    },
    [projectId, organizationSlug]
  );

  return {
    members,
    isLoading,
    error,
    addMember,
    removeMember,
    refreshMembers,
  };
}
