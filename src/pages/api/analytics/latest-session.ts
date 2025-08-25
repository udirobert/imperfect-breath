import { createError, handleApiError } from '../../../lib/errors/error-types';
import { supabase } from '../../../integrations/supabase/client';

/**
 * API route for retrieving the latest breathing session data for a user
 * 
 * Query parameters:
 * - userId: The user ID to get session data for
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'MISSING_PARAMS',
          message: 'Missing required parameter: userId' 
        } 
      });
    }

    // Query the database for the latest session data
    const { data, error } = await supabase
      .from('breathing_sessions')
      .select(`
        id,
        user_id,
        created_at,
        session_duration,
        breath_hold_time,
        restlessness_score,
        pattern_name,
        pattern_id,
        completed_cycles,
        heart_rate_data,
        blood_oxygen_data,
        metrics:session_metrics(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw createError('DB_ERROR', `Database error: ${error.message}`, { 
        code: error.code,
        details: error.details
      });
    }

    if (!data) {
      // No session found, return an empty response with success: false
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_SESSIONS_FOUND',
          message: `No breathing sessions found for user ${userId}`
        }
      });
    }

    // Format the session data for the response
    const sessionData = {
      id: data.id,
      user_id: data.user_id,
      created_at: data.created_at,
      session_duration: data.session_duration,
      breath_hold_time: data.breath_hold_time || 0,
      restlessness_score: data.restlessness_score || 0,
      pattern_name: data.pattern_name,
      pattern_id: data.pattern_id,
      completed_cycles: data.completed_cycles,
      heart_rate: data.heart_rate_data || [],
      blood_oxygen: data.blood_oxygen_data || [],
      metrics: data.metrics || {}
    };

    // Return success response with session data
    return res.status(200).json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to retrieve session data');
  }
}