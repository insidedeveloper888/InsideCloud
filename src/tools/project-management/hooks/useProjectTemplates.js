/**
 * useProjectTemplates Hook
 * Manages project template CRUD operations and state
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useProjectTemplates(organizationSlug, individualId = null) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all templates
  const refreshTemplates = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/project-templates?organization_slug=${organizationSlug}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
      console.error('Failed to fetch project templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  // Initial fetch
  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  // Create template
  const createTemplate = useCallback(
    async (templateData) => {
      console.log('[useProjectTemplates] createTemplate called with organizationSlug:', organizationSlug);
      if (!organizationSlug) {
        throw new Error('Organization not selected. Please select an organization first.');
      }
      try {
        const response = await fetch(
          `${API_BASE}/project-templates?organization_slug=${organizationSlug}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...templateData,
              organization_slug: organizationSlug,
              individual_id: individualId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create template');
        }

        const newTemplate = await response.json();
        setTemplates((prev) => [...prev, newTemplate]);
        return newTemplate;
      } catch (err) {
        console.error('[useProjectTemplates] createTemplate error:', err);
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  // Update template
  const updateTemplate = useCallback(
    async (templateId, templateData) => {
      if (!organizationSlug) {
        throw new Error('Organization not selected. Please select an organization first.');
      }
      try {
        const response = await fetch(
          `${API_BASE}/project-templates/${templateId}?organization_slug=${organizationSlug}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...templateData,
              organization_slug: organizationSlug,
              individual_id: individualId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update template');
        }

        const updatedTemplate = await response.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? updatedTemplate : t))
        );
        return updatedTemplate;
      } catch (err) {
        console.error('[useProjectTemplates] updateTemplate error:', err);
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  // Delete template
  const deleteTemplate = useCallback(
    async (templateId) => {
      if (!organizationSlug) {
        throw new Error('Organization not selected. Please select an organization first.');
      }
      try {
        const response = await fetch(
          `${API_BASE}/project-templates/${templateId}?organization_slug=${organizationSlug}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete template');
        }

        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } catch (err) {
        console.error('[useProjectTemplates] deleteTemplate error:', err);
        throw err;
      }
    },
    [organizationSlug]
  );

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates,
  };
}
