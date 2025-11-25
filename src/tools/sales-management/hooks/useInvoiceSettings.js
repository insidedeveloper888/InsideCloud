import { useState, useEffect, useCallback } from 'react';

export function useInvoiceSettings(organizationSlug) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!organizationSlug) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/invoice_settings?organization_slug=${organizationSlug}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates) => {
    try {
      const response = await fetch(`/api/invoice_settings?organization_slug=${organizationSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setSettings(data);
      return data;
    } catch (error) {
      console.error('Error updating invoice settings:', error);
      throw error;
    }
  };

  const previewFormat = async (format, counter = 1) => {
    try {
      const response = await fetch('/api/invoice_settings/preview_format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ format, counter }),
      });

      if (!response.ok) {
        throw new Error('Failed to preview format');
      }

      const data = await response.json();
      // Return just the preview string, not the whole object
      return typeof data === 'object' && data.preview ? data.preview : data;
    } catch (error) {
      console.error('Error previewing format:', error);
      return null;
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    previewFormat,
    fetchSettings,
  };
}
