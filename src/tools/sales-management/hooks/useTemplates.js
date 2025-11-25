import { useState, useEffect, useCallback } from 'react';

const resolveApiOrigin = () =>
  process.env.REACT_APP_API_ORIGIN || window.location.origin;

/**
 * Custom hook for managing document templates
 * @param {string} organizationSlug - Organization identifier
 * @param {string} documentType - Optional filter by document type ('quotation', 'sales_order', 'delivery_order', 'invoice')
 */
export function useTemplates(organizationSlug, documentType = null) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch templates from API
   */
  const fetchTemplates = useCallback(async () => {
    if (!organizationSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ organization_slug: organizationSlug });
      if (documentType) {
        params.append('document_type', documentType);
      }

      const response = await fetch(
        `${resolveApiOrigin()}/api/templates?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }

      const result = await response.json();

      // API returns { code: 0, data: [...] }
      if (result.code === 0) {
        setTemplates(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch templates');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug, documentType]);

  /**
   * Get a single template by ID
   */
  const getTemplate = useCallback(async (templateId) => {
    try {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        template_id: templateId
      });

      const response = await fetch(
        `${resolveApiOrigin()}/api/templates?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.code === 0) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch template');
      }
    } catch (err) {
      console.error('Error fetching template:', err);
      throw err;
    }
  }, [organizationSlug]);

  /**
   * Create a new template
   */
  const createTemplate = useCallback(async (templateData) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/templates?organization_slug=${organizationSlug}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(templateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create template');
      }

      const result = await response.json();

      if (result.code === 0) {
        const newTemplate = result.data;
        setTemplates(prev => [newTemplate, ...prev]);
        return newTemplate;
      } else {
        throw new Error(result.message || 'Failed to create template');
      }
    } catch (err) {
      console.error('Error creating template:', err);
      throw err;
    }
  }, [organizationSlug]);

  /**
   * Update a template
   */
  const updateTemplate = useCallback(async (templateId, updates) => {
    try {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        template_id: templateId
      });

      const response = await fetch(
        `${resolveApiOrigin()}/api/templates?${params}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update template');
      }

      const result = await response.json();

      if (result.code === 0) {
        const updatedTemplate = result.data;
        setTemplates(prev =>
          prev.map(template => (template.id === templateId ? updatedTemplate : template))
        );
        return updatedTemplate;
      } else {
        throw new Error(result.message || 'Failed to update template');
      }
    } catch (err) {
      console.error('Error updating template:', err);
      throw err;
    }
  }, [organizationSlug]);

  /**
   * Delete a template (soft delete - sets is_active to false)
   */
  const deleteTemplate = useCallback(async (templateId) => {
    try {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        template_id: templateId
      });

      const response = await fetch(
        `${resolveApiOrigin()}/api/templates?${params}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete template');
      }

      const result = await response.json();

      if (result.code === 0) {
        setTemplates(prev => prev.filter(template => template.id !== templateId));
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      throw err;
    }
  }, [organizationSlug]);

  /**
   * Set a template as default for its document type
   */
  const setDefaultTemplate = useCallback(async (templateId) => {
    try {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        action: 'set-default',
        template_id: templateId
      });

      const response = await fetch(
        `${resolveApiOrigin()}/api/templates?${params}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set default template');
      }

      const result = await response.json();

      if (result.code === 0) {
        // Refresh templates to get updated is_default flags
        await fetchTemplates();
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to set default template');
      }
    } catch (err) {
      console.error('Error setting default template:', err);
      throw err;
    }
  }, [organizationSlug, fetchTemplates]);

  /**
   * Duplicate a template
   */
  const duplicateTemplate = useCallback(async (templateId) => {
    try {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        action: 'duplicate',
        template_id: templateId
      });

      const response = await fetch(
        `${resolveApiOrigin()}/api/templates?${params}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to duplicate template');
      }

      const result = await response.json();

      if (result.code === 0) {
        const duplicatedTemplate = result.data;
        setTemplates(prev => [duplicatedTemplate, ...prev]);
        return duplicatedTemplate;
      } else {
        throw new Error(result.message || 'Failed to duplicate template');
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
      throw err;
    }
  }, [organizationSlug]);

  /**
   * Initialize default templates for the organization
   */
  const initializeDefaultTemplates = useCallback(async () => {
    console.log('[useTemplates] initializeDefaultTemplates called');
    console.log('[useTemplates] organizationSlug:', organizationSlug);

    try {
      const params = new URLSearchParams({
        organization_slug: organizationSlug,
        action: 'initialize'
      });

      const url = `${resolveApiOrigin()}/api/templates?${params}`;
      console.log('[useTemplates] Calling API:', url);

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      });

      console.log('[useTemplates] Response status:', response.status);
      console.log('[useTemplates] Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useTemplates] API returned error:', errorData);
        throw new Error(errorData.message || 'Failed to initialize templates');
      }

      const result = await response.json();
      console.log('[useTemplates] API result:', result);

      if (result.code === 0) {
        console.log('[useTemplates] Success! Refreshing templates...');
        // Refresh templates after initialization
        await fetchTemplates();
        console.log('[useTemplates] Templates refreshed');
        return true;
      } else {
        console.error('[useTemplates] API returned non-zero code:', result.code);
        throw new Error(result.message || 'Failed to initialize templates');
      }
    } catch (err) {
      console.error('[useTemplates] Error initializing default templates:', err);
      console.error('[useTemplates] Error type:', err.constructor.name);
      console.error('[useTemplates] Error message:', err.message);
      throw err;
    }
  }, [organizationSlug, fetchTemplates]);

  // Fetch templates on mount and when dependencies change
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    duplicateTemplate,
    initializeDefaultTemplates,
  };
}
