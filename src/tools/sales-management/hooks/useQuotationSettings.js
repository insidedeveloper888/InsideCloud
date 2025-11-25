import { useState, useEffect, useCallback } from 'react';

const resolveApiOrigin = () =>
  process.env.REACT_APP_API_ORIGIN || window.location.origin;

export function useQuotationSettings(organizationSlug) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (!organizationSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/quotation_settings?organization_slug=${organizationSlug}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quotation settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching quotation settings:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  const updateSettings = useCallback(async (updates) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/quotation_settings?organization_slug=${organizationSlug}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  }, [organizationSlug]);

  const previewFormat = useCallback(async (format, sampleCounter = 1) => {
    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/quotation_settings/preview_format`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ format, sample_counter: sampleCounter }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to preview format');
      }

      const data = await response.json();
      return data.preview;
    } catch (err) {
      console.error('Error previewing format:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    previewFormat,
    refetch: fetchSettings,
  };
}
