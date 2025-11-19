/**
 * useStages Hook
 * Manages custom contact stages
 */

import { useState, useEffect, useCallback } from 'react';
import { stageAPI } from '../api';

export function useStages(organizationSlug) {
  const [stages, setStages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStages = useCallback(async () => {
    if (!organizationSlug) return;

    setIsLoading(true);
    try {
      const data = await stageAPI.getStages(organizationSlug);
      setStages(data || []);
    } catch (err) {
      console.error('Failed to fetch stages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const addStage = useCallback(
    async (stageData) => {
      try {
        const newStage = await stageAPI.createStage(organizationSlug, stageData);
        setStages((prev) => [...prev, newStage]);
        return newStage;
      } catch (err) {
        console.error('Failed to add stage:', err);
        throw err;
      }
    },
    [organizationSlug]
  );

  const updateStage = useCallback(
    async (stageId, stageData) => {
      try {
        const updated = await stageAPI.updateStage(
          organizationSlug,
          stageId,
          stageData
        );
        setStages((prev) =>
          prev.map((s) => (s.id === stageId ? updated : s))
        );
        return updated;
      } catch (err) {
        console.error('Failed to update stage:', err);
        throw err;
      }
    },
    [organizationSlug]
  );

  const deleteStage = useCallback(
    async (stageId) => {
      try {
        await stageAPI.deleteStage(organizationSlug, stageId);
        setStages((prev) => prev.filter((s) => s.id !== stageId));
      } catch (err) {
        console.error('Failed to delete stage:', err);
        throw err;
      }
    },
    [organizationSlug]
  );

  return {
    stages,
    isLoading,
    addStage,
    updateStage,
    deleteStage,
  };
}
