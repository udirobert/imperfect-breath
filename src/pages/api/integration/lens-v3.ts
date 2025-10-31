import { lensAPI } from '../../../lib/lens/client';
import { handleApiError, createError } from '../../../lib/errors/error-types';
import { supabase } from '../../../integrations/supabase/client';

/**
 * API route for Lens Protocol v3 integration
 * 
 * This endpoint provides integration with Lens Protocol v3 features including:
 * - Authentication with Lens Protocol v3
 * - Content publishing to Grove storage
 * - Social graph interactions
 * - Account abstraction support
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
    // Authenticate the request using Supabase
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

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the session with Supabase
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

    const { action, data } = req.body;

    switch (action) {
      case 'authenticate':
        // Authenticate with Lens Protocol v3
        if (!data.walletAddress || !data.signature) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required fields: walletAddress and signature'
            }
          });
        }

        const authResult = await lensAPI.login(data.walletAddress, async () => data.signature);
        if (!authResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'LENS_AUTH_FAILED',
              message: authResult.error || 'Failed to authenticate with Lens Protocol'
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: authResult.data,
          message: 'Successfully authenticated with Lens Protocol v3'
        });

      case 'createPost':
        // Create a post using Lens Protocol v3
        if (!data.contentUri) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required field: contentUri'
            }
          });
        }

        const postResult = await lensAPI.createPost(data.contentUri);
        if (!postResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'LENS_POST_FAILED',
              message: postResult.error || 'Failed to create post on Lens Protocol'
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: postResult.data,
          message: 'Successfully created post on Lens Protocol v3'
        });

      case 'follow':
        // Follow an account using Lens Protocol v3
        if (!data.accountAddress) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required field: accountAddress'
            }
          });
        }

        const followResult = await lensAPI.followAccount(data.accountAddress);
        if (!followResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'LENS_FOLLOW_FAILED',
              message: followResult.error || 'Failed to follow account on Lens Protocol'
            }
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Successfully followed account on Lens Protocol v3'
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Invalid action: ${action}. Supported actions: authenticate, createPost, follow`
          }
        });
    }
  } catch (error) {
    return handleApiError(res, error, 'Failed to process Lens Protocol v3 integration request');
  }
}