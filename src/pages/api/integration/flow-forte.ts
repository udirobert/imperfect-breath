import { FlowAuthManager } from '../../../auth/composables/useFlowAuth';
import { handleApiError, createError } from '../../../lib/errors/error-types';
import { supabase } from '../../../integrations/supabase/client';

/**
 * API route for Flow Forte integration
 * 
 * This endpoint provides integration with Flow Forte features including:
 * - Scheduled transactions
 * - Flow Actions framework
 * - WebAuthn authentication
 * - Forte-specific NFT minting capabilities
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

    // Get Flow Auth Manager instance
    const flowAuthManager = FlowAuthManager.getInstance();

    switch (action) {
      case 'scheduleTransaction':
        // Schedule a transaction for future execution
        if (!data.transaction || !data.executionTime) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required fields: transaction and executionTime'
            }
          });
        }

        const scheduleResult = await flowAuthManager.scheduleTransaction(
          data.transaction,
          new Date(data.executionTime)
        );
        
        if (!scheduleResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FLOW_SCHEDULE_FAILED',
              message: scheduleResult.error || 'Failed to schedule transaction on Flow Forte'
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            transactionId: scheduleResult.transactionId
          },
          message: 'Successfully scheduled transaction on Flow Forte'
        });

      case 'getScheduledTransactions':
        // Get all scheduled transactions for the user
        const transactionsResult = await flowAuthManager.getScheduledTransactions();
        
        if (!transactionsResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FLOW_GET_SCHEDULED_FAILED',
              message: transactionsResult.error || 'Failed to fetch scheduled transactions'
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            transactions: transactionsResult.transactions
          },
          message: 'Successfully fetched scheduled transactions'
        });

      case 'cancelScheduledTransaction':
        // Cancel a scheduled transaction
        if (!data.transactionId) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required field: transactionId'
            }
          });
        }

        const cancelResult = await flowAuthManager.cancelScheduledTransaction(data.transactionId);
        
        if (!cancelResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FLOW_CANCEL_SCHEDULED_FAILED',
              message: cancelResult.error || 'Failed to cancel scheduled transaction'
            }
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Successfully canceled scheduled transaction'
        });

      case 'getCapabilities':
        // Get Flow Forte capabilities
        const capabilities = flowAuthManager.getCapabilities();
        
        return res.status(200).json({
          success: true,
          data: {
            capabilities
          },
          message: 'Successfully fetched Flow Forte capabilities'
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Invalid action: ${action}. Supported actions: scheduleTransaction, getScheduledTransactions, cancelScheduledTransaction, getCapabilities`
          }
        });
    }
  } catch (error) {
    return handleApiError(res, error, 'Failed to process Flow Forte integration request');
  }
}