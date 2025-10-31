import { revenueCatAuthIntegration } from '../../../lib/monetization/revenueCatAuthIntegration';
import { handleApiError, createError } from '../../../lib/errors/error-types';
import { supabase } from '../../../integrations/supabase/client';

/**
 * API route for RevenueCat integration
 * 
 * This endpoint provides integration with RevenueCat features including:
 * - Email-based user identification
 * - Web2 onboarding flow
 * - Graceful fallbacks for all auth methods
 * - Developer override capabilities
 * - Secure key management
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
      case 'identifyUser':
        // Identify user with RevenueCat
        if (!data.userId) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required field: userId'
            }
          });
        }

        // Determine auth method and call appropriate function
        let identifyResult;
        if (data.authMethod === 'email' && data.email) {
          identifyResult = await revenueCatAuthIntegration.handleSecureEmailAuth(
            data.userId,
            data.email,
            data.secureToken
          );
        } else if (data.authMethod === 'wallet' && data.walletAddress) {
          identifyResult = await revenueCatAuthIntegration.handleWalletAuth(
            data.userId,
            data.walletAddress,
            data.chainId
          );
        } else if (data.authMethod === 'lens' && data.lensProfile) {
          identifyResult = await revenueCatAuthIntegration.handleLensAuth(data.lensProfile);
        } else if (data.authMethod === 'flow' && data.flowAddress) {
          identifyResult = await revenueCatAuthIntegration.handleFlowAuth(
            data.userId,
            data.flowAddress
          );
        } else {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_AUTH_METHOD',
              message: 'Invalid authentication method or missing required parameters'
            }
          });
        }

        if (!identifyResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'REVENUECAT_IDENTIFY_FAILED',
              message: identifyResult.error || 'Failed to identify user with RevenueCat'
            }
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Successfully identified user with RevenueCat'
        });

      case 'setDeveloperOverride':
        // Set developer override for testing
        if (!data.tier) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required field: tier'
            }
          });
        }

        const overrideResult = await revenueCatAuthIntegration.setDeveloperOverride(
          data.tier,
          data.features
        );
        
        if (!overrideResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'REVENUECAT_OVERRIDE_FAILED',
              message: overrideResult.error || 'Failed to set developer override'
            }
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Successfully set developer override'
        });

      case 'clearDeveloperOverride':
        // Clear developer override
        const clearResult = await revenueCatAuthIntegration.clearDeveloperOverride();
        
        if (!clearResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'REVENUECAT_CLEAR_OVERRIDE_FAILED',
              message: clearResult.error || 'Failed to clear developer override'
            }
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Successfully cleared developer override'
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Invalid action: ${action}. Supported actions: identifyUser, setDeveloperOverride, clearDeveloperOverride`
          }
        });
    }
  } catch (error) {
    return handleApiError(res, error, 'Failed to process RevenueCat integration request');
  }
}