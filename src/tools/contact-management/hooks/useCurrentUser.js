/**
 * useCurrentUser Hook
 * Fetches the current authenticated user including individual_id
 * Used for audit fields (created_by, updated_by, deleted_by)
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log('🔍 [useCurrentUser] Fetching current user...');
        const API_BASE = process.env.REACT_APP_API_BASE || '';
        const response = await axios.get(`${API_BASE}/api/current_user`, {
          withCredentials: true,
        });

        console.log('📦 [useCurrentUser] API Response:', response.data);

        if (response.data && response.data.code === 0 && response.data.data) {
          console.log('✅ [useCurrentUser] Current user data:', response.data.data);
          console.log('🆔 [useCurrentUser] Individual ID:', response.data.data.individual_id);
          setCurrentUser(response.data.data);
        } else {
          console.warn('⚠️  [useCurrentUser] Invalid response structure:', response.data);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('❌ [useCurrentUser] Failed to fetch current user:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const individualId = currentUser?.individual_id || null;

  return {
    currentUser,
    isLoading,
    individualId,
  };
}
