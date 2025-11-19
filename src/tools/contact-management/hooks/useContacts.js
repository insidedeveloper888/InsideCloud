/**
 * useContacts Hook
 * Manages contact CRUD operations and state
 */

import { useState, useEffect, useCallback } from 'react';
import { contactAPI } from '../api';

export function useContacts(organizationSlug, individualId = null) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all contacts
  const refreshContacts = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await contactAPI.getContacts(organizationSlug);
      setContacts(data || []);
    } catch (err) {
      setError(err.message || '加载联系人失败');
      console.error('Failed to fetch contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  // Initial fetch
  useEffect(() => {
    refreshContacts();
  }, [refreshContacts]);

  // Add contact
  const addContact = useCallback(
    async (contactData) => {
      try {
        console.log('🔧 [useContacts] addContact called');
        console.log('🔧 [useContacts] Organization:', organizationSlug);
        console.log('🔧 [useContacts] Individual ID:', individualId);
        console.log('🔧 [useContacts] Contact data:', contactData);

        const newContact = await contactAPI.createContact(
          organizationSlug,
          contactData,
          individualId
        );

        console.log('✅ [useContacts] Contact created:', newContact);
        setContacts((prev) => [...prev, newContact]);
        return newContact;
      } catch (err) {
        console.error('❌ [useContacts] addContact error:', err);
        setError(err.message || '创建联系人失败');
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  // Update contact
  const updateContact = useCallback(
    async (contactId, contactData) => {
      try {
        console.log('🔧 [useContacts] updateContact called');
        console.log('🔧 [useContacts] Contact ID:', contactId);
        console.log('🔧 [useContacts] Organization:', organizationSlug);
        console.log('🔧 [useContacts] Individual ID:', individualId);
        console.log('🔧 [useContacts] Contact data:', contactData);

        const updatedContact = await contactAPI.updateContact(
          organizationSlug,
          contactId,
          contactData,
          individualId
        );

        console.log('✅ [useContacts] Contact updated:', updatedContact);
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? updatedContact : c))
        );
        return updatedContact;
      } catch (err) {
        console.error('❌ [useContacts] updateContact error:', err);
        setError(err.message || '更新联系人失败');
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  // Delete contact
  const deleteContact = useCallback(
    async (contactId) => {
      try {
        await contactAPI.deleteContact(organizationSlug, contactId, individualId);
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
      } catch (err) {
        setError(err.message || '删除联系人失败');
        throw err;
      }
    },
    [organizationSlug, individualId]
  );

  return {
    contacts,
    isLoading,
    error,
    addContact,
    updateContact,
    deleteContact,
    refreshContacts,
  };
}
