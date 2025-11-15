/**
 * Supabase Client for Frontend
 *
 * This client is used for:
 * - Real-time subscriptions to database changes
 * - Client-side queries (if needed)
 *
 * Note: Backend API still uses service role client for CRUD operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase environment variables not found. Real-time sync will not work.');
  console.warn('   Required: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

// Create Supabase client for frontend
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,  // We handle auth via backend
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,  // Rate limit realtime events
        },
      },
    })
  : null;

// Check if realtime is available
export const isRealtimeAvailable = () => {
  if (!supabase) {
    console.warn('⚠️  Supabase client not initialized. Real-time sync disabled.');
    return false;
  }
  return true;
};

export default supabase;
