/**
 * useTags Hook
 *
 * Manages tag fetching and creation
 */

import { useState, useEffect } from 'react';
import { tagAPI } from '../api';

export function useTags(organizationSlug) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tags
  useEffect(() => {
    if (!organizationSlug) return;

    const fetchTags = async () => {
      try {
        setLoading(true);
        const data = await tagAPI.getTags(organizationSlug);
        setTags(data);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [organizationSlug]);

  // Create a new tag
  const createTag = async (tagName, color = '#3B82F6') => {
    try {
      const newTag = await tagAPI.createTag(organizationSlug, {
        name: tagName,
        color,
      });

      // Add to local state
      setTags((prev) => [...prev, newTag]);

      return newTag;
    } catch (err) {
      console.error('Error creating tag:', err);
      throw err;
    }
  };

  // Update a tag
  const updateTag = async (tagId, updates) => {
    try {
      const updatedTag = await tagAPI.updateTag(
        tagId,
        organizationSlug,
        updates
      );

      // Update local state
      setTags((prev) =>
        prev.map((tag) => (tag.id === tagId ? updatedTag : tag))
      );

      return updatedTag;
    } catch (err) {
      console.error('Error updating tag:', err);
      throw err;
    }
  };

  // Delete a tag
  const deleteTag = async (tagId) => {
    try {
      await tagAPI.deleteTag(tagId, organizationSlug);

      // Remove from local state
      setTags((prev) => prev.filter((tag) => tag.id !== tagId));
    } catch (err) {
      console.error('Error deleting tag:', err);
      throw err;
    }
  };

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refetch: () => {
      // Trigger a refetch by updating a dependency
      setLoading(true);
    },
  };
}
