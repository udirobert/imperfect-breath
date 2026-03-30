import { handleApiError } from '../../../lib/errors/error-types';
import { supabase } from '../../../integrations/supabase/client';

/**
 * API route for Flow Forte integration
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method Not Allowed - this endpoint only accepts POST requests'
      }
    });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token'
        }
      });
    }

    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Flow Forte integration is not currently configured'
      }
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to process Flow Forte integration request');
  }
}