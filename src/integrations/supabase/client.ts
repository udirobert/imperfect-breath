/**
 * Supabase Client Configuration
 * Creates and exports a configured Supabase client instance
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabase as supabaseConfig } from '../../config/environment';

// Initialize the Supabase client using the centralized config
// This ensures consistency and proper error handling
const supabaseUrl = supabaseConfig.url;
const supabaseAnonKey = supabaseConfig.anonKey;

// The environment.ts file will have already validated these variables
// But we'll keep this check for additional safety
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. Authentication and database features will not work.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

/**
 * Helper function to determine if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

export default supabase;