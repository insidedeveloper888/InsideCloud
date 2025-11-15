/**
 * useRealtimeSync Hook
 *
 * Subscribes to Supabase Realtime changes for strategic_map_items table
 * Automatically syncs changes from other users in real-time
 *
 * Usage:
 *   const handleRealtimeUpdate = useCallback((payload) => {
 *     // Handle INSERT, UPDATE, DELETE events
 *   }, []);
 *
 *   useRealtimeSync(organizationId, handleRealtimeUpdate);
 */

import { useEffect, useRef } from 'react';
import supabase, { isRealtimeAvailable } from '../../../lib/supabaseClient';

export function useRealtimeSync(organizationId, onUpdate) {
  const channelRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Skip if realtime not available or no organization ID
    if (!isRealtimeAvailable() || !organizationId) {
      console.log('🔌 Realtime sync: Not available or no organization ID');
      return;
    }

    // Create unique channel name for this organization
    const channelName = `strategic_map_${organizationId}`;

    console.log(`🔌 Subscribing to realtime channel: ${channelName}`);

    // Create channel and subscribe to postgres_changes
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'strategic_map_items',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          console.log('📡 Realtime update received:', {
            event: payload.eventType,
            table: payload.table,
            record: payload.new || payload.old,
          });

          // Call the update handler
          if (onUpdate) {
            onUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log(`🔌 Realtime subscription status: ${status}`);

        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error');
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️  Realtime subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime subscription closed');
        }
      });

    subscriptionRef.current = channelRef.current;

    // Cleanup on unmount or when organizationId changes
    return () => {
      if (subscriptionRef.current) {
        console.log(`🔌 Unsubscribing from channel: ${channelName}`);
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        channelRef.current = null;
      }
    };
  }, [organizationId, onUpdate]);

  // Return the channel for advanced usage (optional)
  return channelRef.current;
}

export default useRealtimeSync;
