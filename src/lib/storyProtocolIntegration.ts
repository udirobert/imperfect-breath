import { useStory } from "../hooks/useStory";
import { EnhancedCustomPattern, StoryProtocolMethods, StoryProtocolMetadata } from "../types/patterns";

/**
 * Creates a set of blockchain methods for a pattern to interact with Story Protocol
 * @param pattern The pattern to create methods for
 * @param storyHook The useStory hook instance (passed to avoid React hooks rules violations)
 * @returns Implementation of StoryProtocolMethods
 */
export function createStoryProtocolMethods(
  pattern: EnhancedCustomPattern,
  storyHook: ReturnType<typeof useStory>
): StoryProtocolMethods {
  return {
    /**
     * Register the pattern on Story Protocol blockchain
     */
    register: async (): Promise<StoryProtocolMetadata> => {
      if (pattern.storyProtocol?.isRegistered) {
        // Already registered, return existing metadata
        return pattern.storyProtocol;
      }

      const ipAsset = await storyHook.registerBreathingPatternIP({
        name: pattern.name,
        description: pattern.description,
        creator: pattern.creator,
        patternPhases: pattern.phases.reduce((acc, phase, index) => {
          acc[`phase_${index}`] = phase.duration || 0;
          return acc;
        }, {} as Record<string, number>),
        audioUrl: (pattern.mediaContent as any)?.guidedAudio,
      });

      if (!ipAsset) {
        throw new Error("Failed to register IP asset");
      }

      // Create the metadata
      const metadata: StoryProtocolMetadata = {
        ipId: ipAsset.id,
        registrationTxHash: ipAsset.ipHash,
        licenseTerms: {
          commercial: ipAsset.licenseTerms?.commercial || pattern.licenseSettings.commercialUse,
          derivatives: ipAsset.licenseTerms?.derivatives || pattern.licenseSettings.allowDerivatives,
          attribution: ipAsset.licenseTerms?.attribution || pattern.licenseSettings.attribution,
          royaltyPercentage: ipAsset.licenseTerms?.royaltyPercentage || pattern.licenseSettings.royaltyPercentage,
        },
        isRegistered: true,
      };

      // Update pattern (note: in React, you'd typically do this via state management)
      pattern.storyProtocol = metadata;
      pattern.ipId = ipAsset.id;

      return metadata;
    },

    /**
     * Set licensing terms for the pattern on Story Protocol
     */
    setLicenseTerms: async (terms: any): Promise<boolean> => {
      if (!pattern.ipId && !pattern.storyProtocol?.ipId) {
        throw new Error("Pattern must be registered before setting license terms");
      }

      const ipId = pattern.ipId || pattern.storyProtocol?.ipId;
      
      if (!ipId) {
        throw new Error("IP ID not found");
      }

      await storyHook.setLicensingTerms(ipId, {
        commercial: terms.commercial,
        derivatives: terms.derivatives,
        attribution: terms.attribution,
        royaltyPercentage: terms.royaltyPercentage,
      });

      // Update pattern metadata
      if (pattern.storyProtocol) {
        pattern.storyProtocol.licenseTerms = terms;
      } else {
        pattern.storyProtocol = {
          ipId,
          isRegistered: true,
          licenseTerms: terms,
        };
      }

      return true;
    },

    /**
     * Check if the pattern is registered on Story Protocol
     */
    checkRegistrationStatus: async (): Promise<boolean> => {
      // If we already know it's registered, return true
      if (pattern.storyProtocol?.isRegistered) {
        return true;
      }

      // If we have an IP ID, check its status
      if (pattern.ipId) {
        try {
          const ipAsset = await storyHook.getIPAsset(pattern.ipId);
          const isRegistered = !!ipAsset;
          
          // Update pattern metadata
          if (isRegistered && ipAsset) {
            pattern.storyProtocol = {
              ipId: pattern.ipId,
              isRegistered: true,
              licenseTerms: ipAsset.licenseTerms ? {
                commercial: ipAsset.licenseTerms.commercial,
                derivatives: ipAsset.licenseTerms.derivatives,
                attribution: ipAsset.licenseTerms.attribution,
                royaltyPercentage: ipAsset.licenseTerms.royaltyPercentage || 0,
              } : undefined,
            };
          }
          
          return isRegistered;
        } catch (err) {
          console.error("Error checking registration status:", err);
          return false;
        }
      }

      return false;
    },

    /**
     * Get the licensing terms for the pattern from Story Protocol
     */
    getLicenseTerms: async (): Promise<any> => {
      if (!pattern.ipId && !pattern.storyProtocol?.ipId) {
        // Return default license terms from pattern
        return {
          commercial: pattern.licenseSettings.commercialUse,
          derivatives: pattern.licenseSettings.allowDerivatives,
          attribution: pattern.licenseSettings.attribution,
          royaltyPercentage: pattern.licenseSettings.royaltyPercentage,
        };
      }

      const ipId = pattern.ipId || pattern.storyProtocol?.ipId;
      
      if (!ipId) {
        throw new Error("IP ID not found");
      }

      try {
        const ipAsset = await storyHook.getIPAsset(ipId);
        
        if (ipAsset && ipAsset.licenseTerms) {
          // Update pattern metadata
          if (pattern.storyProtocol && ipAsset.licenseTerms) {
            pattern.storyProtocol.licenseTerms = {
              commercial: ipAsset.licenseTerms.commercial,
              derivatives: ipAsset.licenseTerms.derivatives,
              attribution: ipAsset.licenseTerms.attribution,
              royaltyPercentage: ipAsset.licenseTerms.royaltyPercentage || 0,
            };
          }
          
          return ipAsset.licenseTerms;
        }
        
        // Fallback to pattern license settings
        return {
          commercial: pattern.licenseSettings.commercialUse,
          derivatives: pattern.licenseSettings.allowDerivatives,
          attribution: pattern.licenseSettings.attribution,
          royaltyPercentage: pattern.licenseSettings.royaltyPercentage,
        };
      } catch (err) {
        console.error("Error getting license terms:", err);
        // Fallback to pattern license settings
        return {
          commercial: pattern.licenseSettings.commercialUse,
          derivatives: pattern.licenseSettings.allowDerivatives,
          attribution: pattern.licenseSettings.attribution,
          royaltyPercentage: pattern.licenseSettings.royaltyPercentage,
        };
      }
    }
  };
}