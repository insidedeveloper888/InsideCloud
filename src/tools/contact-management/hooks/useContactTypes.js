/**
 * useContactTypes Hook
 *
 * Manages contact types fetching and CRUD operations
 * Contact types are organization-specific and support many-to-many relationships with contacts
 */

import { useState, useEffect, useCallback } from 'react';
import { contactTypeAPI } from '../api';

export function useContactTypes(organizationSlug) {
  const [contactTypes, setContactTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch contact types
  const fetchContactTypes = useCallback(async () => {
    if (!organizationSlug) return;

    try {
      setLoading(true);
      setError(null);
      const data = await contactTypeAPI.getContactTypes(organizationSlug);
      // Sort by sort_order, then by name
      const sortedData = [...data].sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      });
      setContactTypes(sortedData);
    } catch (err) {
      console.error('Error fetching contact types:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchContactTypes();
  }, [fetchContactTypes]);

  // Create a new contact type
  const createContactType = async (data) => {
    try {
      const newType = await contactTypeAPI.createContactType(organizationSlug, data);

      // Add to local state and re-sort
      setContactTypes((prev) => {
        const updated = [...prev, newType];
        return updated.sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return a.name.localeCompare(b.name);
        });
      });

      return newType;
    } catch (err) {
      console.error('Error creating contact type:', err);
      throw err;
    }
  };

  // Update a contact type
  const updateContactType = async (typeId, updates) => {
    try {
      const updatedType = await contactTypeAPI.updateContactType(
        organizationSlug,
        typeId,
        updates
      );

      // Update local state
      setContactTypes((prev) =>
        prev.map((type) => (type.id === typeId ? updatedType : type))
      );

      return updatedType;
    } catch (err) {
      console.error('Error updating contact type:', err);
      throw err;
    }
  };

  // Delete a contact type
  const deleteContactType = async (typeId) => {
    try {
      await contactTypeAPI.deleteContactType(organizationSlug, typeId);

      // Remove from local state
      setContactTypes((prev) => prev.filter((type) => type.id !== typeId));
    } catch (err) {
      console.error('Error deleting contact type:', err);
      throw err;
    }
  };

  return {
    contactTypes,
    loading,
    error,
    createContactType,
    updateContactType,
    deleteContactType,
    refetch: fetchContactTypes,
  };
}
