/**
 * useContactSettings Hook
 * Fetch and manage contact management settings (rating scale, etc.)
 */

import { useState, useEffect } from 'react';

export function useContactSettings(organizationSlug) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings
  const fetchSettings = async () => {
    if (!organizationSlug) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/contact-settings?organization_slug=${organizationSlug}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch contact settings');
      }

      const data = await response.json();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching contact settings:', err);
      setError(err.message);
      // Set default settings on error
      setSettings({ max_rating_scale: 10 });
    } finally {
      setLoading(false);
    }
  };

  // Update settings
  const updateSettings = async (updates) => {
    if (!organizationSlug) return;

    try {
      const response = await fetch('/api/contact-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update contact settings');
      }

      const data = await response.json();
      setSettings(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error updating contact settings:', err);
      setError(err.message);
      throw err;
    }
  };

  // Fetch on mount and when organizationSlug changes
  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: fetchSettings,
  };
}
