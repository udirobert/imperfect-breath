import { BreathingPhase, CustomBreathingPhase } from "./breathingPatterns";
import { supabase } from "../integrations/supabase/client";
import { Json } from "../integrations/supabase/types";

export interface CustomPattern {
  id: string; // UUID
  name: string;
  description: string;
  phases: CustomBreathingPhase[];
  category: 'stress' | 'sleep' | 'energy' | 'focus' | 'performance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  creator: string; // User UUID
  tags?: string[];
  ipHash?: string;
  
  // Fields from integration plan
  enhancedMetadata?: Json;
  mediaContent?: Json;
  licensingInfo?: Json;
  ipAssetId?: string;
  licenseTermsId?: string;
}

interface SupabasePattern {
  id: string; // UUID
  name: string;
  description: string | null;
  phases: Json;
  category: string;
  difficulty: string;
  duration: number;
  creator: string; // User UUID
  ip_hash: string | null;
  created_at: string;

  // Fields from integration plan
  enhanced_metadata: Json | null;
  media_content: Json | null;
  licensing_info: Json | null;
  ip_asset_id: string | null;
}

export class PatternStorageService {
  private mapToCustomPattern(supabasePattern: SupabasePattern): CustomPattern {
    return {
      id: supabasePattern.id,
      name: supabasePattern.name,
      description: supabasePattern.description || '',
      phases: supabasePattern.phases as unknown as CustomBreathingPhase[],
      category: supabasePattern.category as 'stress' | 'sleep' | 'energy' | 'focus' | 'performance',
      difficulty: supabasePattern.difficulty as 'beginner' | 'intermediate' | 'advanced',
      duration: supabasePattern.duration,
      creator: supabasePattern.creator,
      ipHash: supabasePattern.ip_hash || undefined,
      enhancedMetadata: supabasePattern.enhanced_metadata || undefined,
      mediaContent: supabasePattern.media_content || undefined,
      licensingInfo: supabasePattern.licensing_info || undefined,
      ipAssetId: supabasePattern.ip_asset_id || undefined,
    };
  }

  private mapToSupabasePattern(customPattern: CustomPattern): Omit<SupabasePattern, 'created_at'> {
    return {
      id: customPattern.id,
      name: customPattern.name,
      description: customPattern.description,
      phases: customPattern.phases as unknown as Json,
      category: customPattern.category,
      difficulty: customPattern.difficulty,
      duration: customPattern.duration,
      creator: customPattern.creator,
      ip_hash: customPattern.ipHash || null,
      enhanced_metadata: customPattern.enhancedMetadata || null,
      media_content: customPattern.mediaContent || null,
      licensing_info: customPattern.licensingInfo || null,
      ip_asset_id: customPattern.ipAssetId || null,
    };
  }

  async savePattern(pattern: CustomPattern): Promise<string> {
    try {
      const supabasePattern = this.mapToSupabasePattern(pattern);
      
      const { data, error } = await supabase
        .from('patterns')
        .upsert(supabasePattern, { onConflict: 'id' })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error saving pattern to Supabase:', error);
        throw new Error('Failed to save pattern');
      }
      
      return data.id;
    } catch (error) {
      console.error('Error saving pattern:', error);
      throw new Error('Failed to save pattern');
    }
  }

  async getPattern(id: string): Promise<CustomPattern | null> {
    try {
      const { data, error } = await supabase
        .from('patterns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error getting pattern from Supabase:', error);
        return null;
      }
      
      return this.mapToCustomPattern(data as SupabasePattern);
    } catch (error) {
      console.error('Error getting pattern:', error);
      return null;
    }
  }

  async deletePattern(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('patterns')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting pattern from Supabase:', error);
        throw new Error('Failed to delete pattern');
      }
    } catch (error) {
      console.error('Error deleting pattern:', error);
      throw new Error('Failed to delete pattern');
    }
  }

  async getUserPatterns(userId: string): Promise<CustomPattern[]> {
    try {
      const { data, error } = await supabase
        .from('patterns')
        .select('*')
        .eq('creator', userId);
      
      if (error) {
        console.error('Error getting user patterns from Supabase:', error);
        return [];
      }
      
      return (data as SupabasePattern[]).map(pattern => this.mapToCustomPattern(pattern));
    } catch (error) {
      console.error('Error getting user patterns:', error);
      return [];
    }
  }

  async searchPatterns(query: PatternSearchQuery): Promise<CustomPattern[]> {
    try {
      let supabaseQuery = supabase.from('patterns').select('*');
      
      if (query.name) {
        supabaseQuery = supabaseQuery.ilike('name', `%${query.name}%`);
      }
      if (query.category) {
        supabaseQuery = supabaseQuery.eq('category', query.category);
      }
      if (query.difficulty) {
        supabaseQuery = supabaseQuery.eq('difficulty', query.difficulty);
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) {
        console.error('Error searching patterns in Supabase:', error);
        return [];
      }
      
      return (data as SupabasePattern[]).map(pattern => this.mapToCustomPattern(pattern));
    } catch (error) {
      console.error('Error searching patterns:', error);
      return [];
    }
  }
}

export interface PatternSearchQuery {
  name?: string;
  category?: CustomPattern['category'];
  difficulty?: CustomPattern['difficulty'];
}
