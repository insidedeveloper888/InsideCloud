/**
 * useOrganizationMembers Hook
 * Fetches organization members for member assignment dropdowns
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useOrganizationMembers(organizationSlug) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch organization members
  const refreshMembers = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use project-specific endpoint that requires project_management access
      // instead of /organization-members which requires contact_management access
      const response = await fetch(
        `${API_BASE}/project-organization-members?organization_slug=${organizationSlug}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch organization members');
      }

      const data = await response.json();
      // API already returns flat structure: { id, display_name, avatar_url, primary_email, role_code }
      // Just ensure all expected fields are present
      const transformedMembers = (data || []).map(member => ({
        ...member,
        // Use existing fields or provide fallbacks
        display_name: member.display_name || member.primary_email || 'Unknown',
        email: member.primary_email,
      }));
      setMembers(transformedMembers);
    } catch (err) {
      setError(err.message || 'Failed to load organization members');
      console.error('Failed to fetch organization members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  // Initial fetch
  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  return {
    members,
    isLoading,
    error,
    refreshMembers,
  };
}
