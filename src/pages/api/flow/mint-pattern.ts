// Using more generic types to avoid import errors
import NFTClient from '../../../lib/flow/clients/nft-client';
import { handleApiError, createError } from '../../../lib/utils/error-utils';
import { supabase } from '../../../lib/supabase';
import type { BreathingPatternAttributes, NFTMetadata, RoyaltyInfo } from '../../../lib/flow/types';

/**
 * API route for minting breathing pattern NFTs
 * 
 * Request body should contain:
 * - pattern: The breathing pattern data
 * - creator: Creator wallet address
 * - metadata: Additional metadata for the NFT
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

    const { pattern, creator, metadata } = req.body;

    if (!pattern || !creator) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'Missing required fields: pattern or creator'
        }
      });
    }

    // Verify that the authenticated user has permission to mint for this creator
    // In this case, we're checking if the creator matches the authenticated user's ID
    // or if they have the appropriate Flow address associated with their account
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, flow_address, ethereum_address')
      .or(`id.eq.${user.id},flow_address.eq.${creator}`)
      .single();
    
    if (userError || !userData) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to mint for this creator'
        }
      });
    }

    // Initialize NFT client
    const nftClient = new NFTClient();
    
    // Ensure the user has their collection setup
    const hasCollection = await nftClient.hasCollectionSetup(creator);
    if (!hasCollection) {
      await nftClient.setupAccount();
    }
    
    // Convert pattern data to the format expected by the NFT client
    const attributes: BreathingPatternAttributes = {
      inhale: pattern.phases[0] || 4,
      hold: pattern.phases[1] || 7,
      exhale: pattern.phases[2] || 8,
      rest: pattern.phases[3] || 0,
      difficulty: pattern.difficulty || 'medium',
      category: pattern.category || 'wellness',
      tags: pattern.tags || [],
      totalCycles: 0,
      estimatedDuration: pattern.duration || 0
    };
    
    // Prepare NFT metadata
    const nftMetadata: NFTMetadata = {
      name: pattern.name,
      description: pattern.description || `A breathing pattern with ${attributes.inhale}-${attributes.hold}-${attributes.exhale}-${attributes.rest} rhythm`,
      image: pattern.image || 'https://imperfect-breath.netlify.app/images/default-pattern.png',
      attributes: []
    };
    
    // Set up royalties
    const royalties: RoyaltyInfo[] = [{
      receiver: creator,
      cut: 10, // 10% royalty
      description: 'Creator royalty'
    }];
    
    // Mint the NFT
    const transactionId = await nftClient.mintBreathingPattern(
      attributes,
      nftMetadata,
      creator,
      royalties
    );
    
    // Get newly minted NFT ID
    const nftIds = await nftClient.getNFTIds(creator);
    const latestNftId = nftIds[nftIds.length - 1];
    
    // Return success response with proper format
    return res.status(200).json({
      success: true,
      data: {
        tokenId: latestNftId,
        transactionId,
        creator: creator,
        patternName: pattern.name,
        timestamp: new Date().toISOString()
      },
      message: `Successfully minted pattern "${pattern.name}" as NFT #${latestNftId}`
    });
  } catch (error) {
    // Use standard error handling without extra context
    return handleApiError(res, error, 'Failed to mint breathing pattern NFT');
  }
}