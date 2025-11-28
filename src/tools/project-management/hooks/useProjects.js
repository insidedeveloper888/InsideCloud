/**
 * useProjects Hook
 * Manages project CRUD operations and state
 * Follows the pattern from useContacts.js
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useProjects(organizationSlug, individualId = null, filters = {}) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all projects
  const refreshProjects = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams({ organization_slug: organizationSlug });
      if (filters.status_id) params.append('status_id', filters.status_id);
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.owner_id) params.append('owner_id', filters.owner_id);
      if (filters.visibility) params.append('visibility', filters.visibility);
      if (filters.template_id) params.append('template_id', filters.template_id);

      const response = await fetch(`${API_BASE}/projects?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load projects');
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug, filters.status_id, filters.customer_id, filters.owner_id, filters.visibility, filters.template_id]);

  // Initial fetch
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Create project
  const createProject = useCallback(
    async (projectData) => {
      try {
        console.log('[useProjects] createProject called');
        console.log('[useProjects] Organization:', organizationSlug);

        const response = await fetch(`${API_BASE}/projects?organization_slug=${organizationSlug}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...projectData,
            organization_slug: organizationSlug,
            individual_id: individualId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create project');
        }

        const newProject = await response.json();
        console.log('[useProjects] Project created:', newProject);
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
      } catch (err) {
        console.error('[useProjects] createProject error:', err);
        setError(err.message || 'Failed to create project');
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  // Update project
  const updateProject = useCallback(
    async (projectId, projectData) => {
      try {
        console.log('[useProjects] updateProject called');
        console.log('[useProjects] Project ID:', projectId);

        const response = await fetch(
          `${API_BASE}/projects/${projectId}?organization_slug=${organizationSlug}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...projectData,
              organization_slug: organizationSlug,
              individual_id: individualId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update project');
        }

        const updatedProject = await response.json();
        console.log('[useProjects] Project updated:', updatedProject);
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? updatedProject : p))
        );
        return updatedProject;
      } catch (err) {
        console.error('[useProjects] updateProject error:', err);
        setError(err.message || 'Failed to update project');
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  // Delete project (soft delete)
  const deleteProject = useCallback(
    async (projectId) => {
      try {
        const params = new URLSearchParams({ organization_slug: organizationSlug });
        if (individualId) params.append('individual_id', individualId);

        const response = await fetch(
          `${API_BASE}/projects/${projectId}?${params.toString()}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete project');
        }

        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } catch (err) {
        console.error('[useProjects] deleteProject error:', err);
        setError(err.message || 'Failed to delete project');
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };
}
