import { CrossNetworkIntegration } from '../../../lib/flow/cross-network/cross-network-integration';
import { handleApiError, createError } from '../../../lib/errors/error-types';
import { supabase } from '../../../integrations/supabase/client';

/**
 * API route for cross-network minting
 * 
 * This endpoint provides cross-network coordination between Flow Forte and Lens Protocol:
 * - NFT minting with social sharing
 * - NFT purchase with social sharing
 * - Breathing challenge creation with cross-network rewards
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

    // Get Cross Network Integration instance
    const crossNetworkIntegration = new CrossNetworkIntegration();

    switch (action) {
      case 'mintWithSocial':
        // Mint an NFT and share on social networks
        if (!data.nft || !data.creatorAddress) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required fields: nft and creatorAddress'
            }
          });
        }

        const mintResult = await crossNetworkIntegration.postMintToLens({
          nft: data.nft,
          transactionId: data.transactionId || `tx_${Date.now()}`,
          uniqueId: data.uniqueId || `mint_${Date.now()}`,
          creatorAddress: data.creatorAddress,
        });

        if (!mintResult) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CROSS_NETWORK_MINT_FAILED',
              message: 'Failed to mint NFT and share on social networks'
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            lensPost: mintResult
          },
          message: 'Successfully minted NFT and shared on social networks'
        });

      case 'purchaseWithSocial':
        // Purchase an NFT and share on social networks
        if (!data.nft || !data.buyerAddress || !data.price) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required fields: nft, buyerAddress, and price'
            }
          });
        }

        const purchaseResult = await crossNetworkIntegration.postPurchaseToLens({
          nft: data.nft,
          transactionId: data.transactionId || `tx_${Date.now()}`,
          uniqueId: data.uniqueId || `purchase_${Date.now()}`,
          buyerAddress: data.buyerAddress,
          price: data.price,
        });

        if (!purchaseResult) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CROSS_NETWORK_PURCHASE_FAILED',
              message: 'Failed to purchase NFT and share on social networks'
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            lensPost: purchaseResult
          },
          message: 'Successfully purchased NFT and shared on social networks'
        });

      case 'createChallenge':
        // Create a breathing challenge with cross-network rewards
        if (!data.challengeName || !data.patternId || !data.participants || !data.duration) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMS',
              message: 'Missing required fields: challengeName, patternId, participants, and duration'
            }
          });
        }

        const challengeResult = await crossNetworkIntegration.createSocialBreathingChallenge({
          challengeName: data.challengeName,
          patternId: data.patternId,
          participants: data.participants,
          duration: data.duration,
          rewards: data.rewards || {
            uniqueId: `reward_${Date.now()}`
          }
        });

        return res.status(200).json({
          success: true,
          data: {
            challengeId: challengeResult.challengeId,
            forteResult: challengeResult.forteResult,
            lensAnnouncement: challengeResult.lensAnnouncement
          },
          message: 'Successfully created breathing challenge with cross-network rewards'
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Invalid action: ${action}. Supported actions: mintWithSocial, purchaseWithSocial, createChallenge`
          }
        });
    }
  } catch (error) {
    return handleApiError(res, error, 'Failed to process cross-network integration request');
  }
}