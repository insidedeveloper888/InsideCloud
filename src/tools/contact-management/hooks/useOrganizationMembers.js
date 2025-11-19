/**
 * useOrganizationMembers Hook
 * Fetches organization members (individuals) for assignment dropdowns
 */

import { useState, useEffect, useCallback } from 'react';
import { organizationAPI } from '../api';

export function useOrganizationMembers(organizationSlug) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await organizationAPI.getMembers(organizationSlug);
      setMembers(data || []);
    } catch (err) {
      setError(err.message || '加载成员失败');
      console.error('Failed to fetch organization members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    isLoading,
    error,
    refreshMembers: fetchMembers,
  };
}
