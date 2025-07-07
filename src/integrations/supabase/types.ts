/**
 * Supabase Database Types
 * Generated types for the Supabase database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          pattern_name: string
          session_duration: number
          breath_hold_time: number
          restlessness_score: number
          quality_score?: number | null
          notes?: string | null
          ip_registered?: boolean | null
          ip_asset_id?: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          pattern_name: string
          session_duration: number
          breath_hold_time: number
          restlessness_score: number
          quality_score?: number | null
          notes?: string | null
          ip_registered?: boolean | null
          ip_asset_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          pattern_name?: string
          session_duration?: number
          breath_hold_time?: number
          restlessness_score?: number
          quality_score?: number | null
          notes?: string | null
          ip_registered?: boolean | null
          ip_asset_id?: string | null
        }
      }
      patterns: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          description: string
          inhale: number
          hold: number
          exhale: number
          rest: number
          is_public: boolean
          ip_registered?: boolean | null
          ip_asset_id?: string | null
          lens_post_id?: string | null
          license_terms?: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          description: string
          inhale: number
          hold: number
          exhale: number
          rest: number
          is_public?: boolean
          ip_registered?: boolean | null
          ip_asset_id?: string | null
          lens_post_id?: string | null
          license_terms?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          description?: string
          inhale?: number
          hold?: number
          exhale?: number
          rest?: number
          is_public?: boolean
          ip_registered?: boolean | null
          ip_asset_id?: string | null
          lens_post_id?: string | null
          license_terms?: Json | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          created_at: string
          user_id: string
          display_name?: string | null
          bio?: string | null
          lens_profile_id?: string | null
          flow_address?: string | null
          story_address?: string | null
          has_completed_onboarding: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          display_name?: string | null
          bio?: string | null
          lens_profile_id?: string | null
          flow_address?: string | null
          story_address?: string | null
          has_completed_onboarding?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          display_name?: string | null
          bio?: string | null
          lens_profile_id?: string | null
          flow_address?: string | null
          story_address?: string | null
          has_completed_onboarding?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
