// Using more generic types to avoid import errors
import { ipRegistrationService } from '../../../lib/ip/registration';
import { handleApiError } from '../../../lib/utils/error-utils';
import { createError } from '../../../lib/utils/error-utils';
import type { UserWallet } from '../../../types/blockchain';

/**
 * API route for registering breathing patterns as intellectual property using Story Protocol
 * 
 * Request body should contain:
 * - pattern: The breathing pattern data
 * - creator: Creator wallet address (or user ID)
 * - licenseTerms: License terms for the IP
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { pattern, creator, licenseTerms } = req.body;

    if (!pattern || !creator) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'MISSING_PARAMS',
          message: 'Missing required fields: pattern or creator' 
        } 
      });
    }

    // Validate the pattern has necessary fields
    if (!pattern.name || !pattern.description) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PATTERN',
          message: 'Pattern must include name and description'
        }
      });
    }

    // Set creator address on pattern if not already present
    if (!pattern.creator) {
      pattern.creator = creator;
    }

    // Create wallet object from the creator address with correct types
    const wallet: UserWallet = {
      address: creator,
      chainId: 1315, // Story Protocol Aeneid testnet chain ID as number
      balance: '0',
      network: 'testnet',
      provider: 'other' // Using 'other' to represent Flow blockchain
    };

    // Set default royalty percentage
    const royaltyPercent = licenseTerms?.royaltyPercent || 10;

    // Register the pattern using the IP registration service
    const registration = await ipRegistrationService.registerPattern(
      pattern,
      wallet,
      royaltyPercent
    );

    // Set license terms if provided
    if (licenseTerms) {
      await ipRegistrationService.setLicenseTerms(
        registration.ipHash,
        {
          commercialUse: licenseTerms.commercialUse || true,
          derivativeWorks: licenseTerms.derivativeWorks || true,
          attributionRequired: licenseTerms.attributionRequired || true,
          royaltyPercent: licenseTerms.royaltyPercent || 10
        }
      );
    }

    // Return success response with IP registration details
    return res.status(200).json({
      success: true,
      ipId: registration.ipHash,
      licenseId: registration.ipHash, // Using ipHash as licenseId for now
      transactionHash: registration.transactionHash,
      creator: registration.creator,
      registrationDate: registration.timestamp,
      message: `Successfully registered "${pattern.name}" as intellectual property`
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to register IP');
  }
}