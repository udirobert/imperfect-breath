import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/environment';

// Database type definitions
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          flow_address?: string;
          lens_profile_id?: string;
          ethereum_address?: string;
          username?: string;
          email?: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string;
          preferred_chain: string;
          notification_settings: any;
          privacy_settings: any;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
          last_active_at: string;
        };
        Insert: {
          id?: string;
          flow_address?: string;
          lens_profile_id?: string;
          ethereum_address?: string;
          username?: string;
          email?: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string;
          preferred_chain?: string;
          notification_settings?: any;
          privacy_settings?: any;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
        Update: {
          id?: string;
          flow_address?: string;
          lens_profile_id?: string;
          ethereum_address?: string;
          username?: string;
          email?: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string;
          preferred_chain?: string;
          notification_settings?: any;
          privacy_settings?: any;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
      };
      breathing_patterns: {
        Row: {
          id: string;
          name: string;
          description?: string;
          creator_id: string;
          phases: any;
          total_duration: number;
          difficulty_level: number;
          category: string;
          tags: string[];
          audio_url?: string;
          thumbnail_url?: string;
          flow_nft_id?: number;
          lens_publication_id?: string;
          story_ip_id?: string;
          is_public: boolean;
          is_for_sale: boolean;
          price?: number;
          currency: string;
          usage_count: number;
          rating_average: number;
          rating_count: number;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          creator_id: string;
          phases: any;
          total_duration: number;
          difficulty_level?: number;
          category?: string;
          tags?: string[];
          audio_url?: string;
          thumbnail_url?: string;
          flow_nft_id?: number;
          lens_publication_id?: string;
          story_ip_id?: string;
          is_public?: boolean;
          is_for_sale?: boolean;
          price?: number;
          currency?: string;
          usage_count?: number;
          rating_average?: number;
          rating_count?: number;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          creator_id?: string;
          phases?: any;
          total_duration?: number;
          difficulty_level?: number;
          category?: string;
          tags?: string[];
          audio_url?: string;
          thumbnail_url?: string;
          flow_nft_id?: number;
          lens_publication_id?: string;
          story_ip_id?: string;
          is_public?: boolean;
          is_for_sale?: boolean;
          price?: number;
          currency?: string;
          usage_count?: number;
          rating_average?: number;
          rating_count?: number;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      breathing_sessions: {
        Row: {
          id: string;
          user_id: string;
          pattern_id?: string;
          duration: number;
          cycles_completed: number;
          bpm?: number;
          consistency_score?: number;
          restlessness_score?: number;
          breath_hold_time?: number;
          ai_score?: number;
          ai_feedback?: any;
          ai_suggestions?: string[];
          pose_data?: any;
          movement_analysis?: any;
          environment_data?: any;
          device_info?: any;
          flow_transaction_id?: string;
          lens_post_id?: string;
          is_demo: boolean;
          started_at: string;
          completed_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pattern_id?: string;
          duration: number;
          cycles_completed?: number;
          bpm?: number;
          consistency_score?: number;
          restlessness_score?: number;
          breath_hold_time?: number;
          ai_score?: number;
          ai_feedback?: any;
          ai_suggestions?: string[];
          pose_data?: any;
          movement_analysis?: any;
          environment_data?: any;
          device_info?: any;
          flow_transaction_id?: string;
          lens_post_id?: string;
          started_at: string;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pattern_id?: string;
          duration?: number;
          cycles_completed?: number;
          bpm?: number;
          consistency_score?: number;
          restlessness_score?: number;
          breath_hold_time?: number;
          ai_score?: number;
          ai_feedback?: any;
          ai_suggestions?: string[];
          pose_data?: any;
          movement_analysis?: any;
          environment_data?: any;
          device_info?: any;
          flow_transaction_id?: string;
          lens_post_id?: string;
          is_demo?: boolean;
          started_at?: string;
          completed_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Create Supabase client
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Helper functions for common operations
export class SupabaseService {
  // User management
  static async createUser(userData: Database['public']['Tables']['users']['Insert']) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserByFlowAddress(flowAddress: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('flow_address', flowAddress)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }

  static async updateUser(userId: string, updates: Database['public']['Tables']['users']['Update']) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Breathing patterns
  static async createBreathingPattern(patternData: Database['public']['Tables']['breathing_patterns']['Insert']) {
    const { data, error } = await supabase
      .from('breathing_patterns')
      .insert(patternData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getPublicPatterns(limit = 20, offset = 0, includeDemoData = false) {
    let query = supabase
      .from('breathing_patterns')
      .select(`
        *,
        creator:users(id, username, display_name, avatar_url, is_demo)
      `)
      .eq('is_public', true);

    // Filter out demo data by default
    if (!includeDemoData) {
      query = query.eq('is_demo', false);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }

  static async getUserPatterns(userId: string) {
    const { data, error } = await supabase
      .from('breathing_patterns')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Breathing sessions
  static async createSession(sessionData: Database['public']['Tables']['breathing_sessions']['Insert']) {
    const { data, error } = await supabase
      .from('breathing_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserSessions(userId: string, limit = 50, includeDemoData = false) {
    let query = supabase
      .from('breathing_sessions')
      .select(`
        *,
        pattern:breathing_patterns(id, name, category, is_demo)
      `)
      .eq('user_id', userId);

    // Filter out demo data by default
    if (!includeDemoData) {
      query = query.eq('is_demo', false);
    }

    const { data, error } = await query
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async updateSession(sessionId: string, updates: Database['public']['Tables']['breathing_sessions']['Update']) {
    const { data, error } = await supabase
      .from('breathing_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Analytics
  static async getUserStats(userId: string) {
    const { data: sessions, error: sessionsError } = await supabase
      .from('breathing_sessions')
      .select('duration, ai_score, started_at')
      .eq('user_id', userId);

    if (sessionsError) throw sessionsError;

    const { data: patterns, error: patternsError } = await supabase
      .from('breathing_patterns')
      .select('id, usage_count, rating_average')
      .eq('creator_id', userId);

    if (patternsError) throw patternsError;

    return {
      totalSessions: sessions?.length || 0,
      totalMinutes: sessions?.reduce((sum, s) => sum + (s.duration / 60), 0) || 0,
      averageScore: sessions?.reduce((sum, s) => sum + (s.ai_score || 0), 0) / (sessions?.length || 1) || 0,
      patternsCreated: patterns?.length || 0,
      totalUsage: patterns?.reduce((sum, p) => sum + p.usage_count, 0) || 0,
    };
  }

  // Real-time subscriptions
  static subscribeToUserSessions(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user_sessions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'breathing_sessions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  static subscribeToPatternUpdates(patternId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`pattern_${patternId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'breathing_patterns',
          filter: `id=eq.${patternId}`
        },
        callback
      )
      .subscribe();
  }
}

export default supabase;
