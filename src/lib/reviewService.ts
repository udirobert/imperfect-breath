import { supabase } from '@/integrations/supabase/client';

export interface PatternReview {
  id?: string;
  pattern_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at?: string;
}

export class ReviewService {
  async submitReview(review: Omit<PatternReview, 'id' | 'created_at'>): Promise<PatternReview> {
    try {
      const { data, error } = await (supabase as any)
        .from('pattern_reviews')
        .insert([review])
        .select()
        .single();

      if (error) {
        console.error('Error submitting review to Supabase:', error);
        throw new Error('Failed to submit review');
      }

      return data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error('Failed to submit review');
    }
  }

  async getReviewsForPattern(patternId: string): Promise<PatternReview[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('pattern_reviews')
        .select('*')
        .eq('pattern_id', patternId);

      if (error) {
        console.error('Error fetching reviews from Supabase:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  async getAllReviews(): Promise<PatternReview[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('pattern_reviews')
        .select('*');

      if (error) {
        console.error('Error fetching all reviews from Supabase:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      return [];
    }
  }
}