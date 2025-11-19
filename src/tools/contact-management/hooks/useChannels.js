/**
 * useChannels Hook
 * Manages traffic channels
 */

import { useState, useEffect, useCallback } from 'react';
import { channelAPI } from '../api';

export function useChannels(organizationSlug) {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    try {
      const data = await channelAPI.getChannels(organizationSlug);
      setChannels(data || []);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const addChannel = useCallback(
    async (channelData) => {
      try {
        const newChannel = await channelAPI.createChannel(
          organizationSlug,
          channelData
        );
        setChannels((prev) => [...prev, newChannel]);
        return newChannel;
      } catch (err) {
        console.error('Failed to add channel:', err);
        throw err;
      }
    },
    [organizationSlug]
  );

  const updateChannel = useCallback(
    async (channelId, channelData) => {
      try {
        const updated = await channelAPI.updateChannel(
          organizationSlug,
          channelId,
          channelData
        );
        setChannels((prev) =>
          prev.map((c) => (c.id === channelId ? updated : c))
        );
        return updated;
      } catch (err) {
        console.error('Failed to update channel:', err);
        throw err;
      }
    },
    [organizationSlug]
  );

  const deleteChannel = useCallback(
    async (channelId) => {
      try {
        await channelAPI.deleteChannel(organizationSlug, channelId);
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
      } catch (err) {
        console.error('Failed to delete channel:', err);
        throw err;
      }
    },
    [organizationSlug]
  );

  return {
    channels,
    isLoading,
    addChannel,
    updateChannel,
    deleteChannel,
  };
}
