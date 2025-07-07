import { useStory } from "../hooks/useStory";
import { LicenseTerms } from "../lib/story";
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

      const ipRegistration = await storyHook.registerBreathingPatternIP({
        name: pattern.name,
        description: pattern.description,
        creator: pattern.creator,
        inhale: pattern.phases[0]?.duration || 0,
        hold: pattern.phases[1]?.duration || 0,
        exhale: pattern.phases[2]?.duration || 0,
        rest: pattern.phases[3]?.duration || 0,
        difficulty: pattern.difficulty,
        category: pattern.category,
        tags: pattern.tags || [],
      });

      if (!ipRegistration || !ipRegistration.success) {
        throw new Error("Failed to register IP asset");
      }

      // Create the metadata
      const metadata: StoryProtocolMetadata = {
        ipId: ipRegistration.ipId,
        registrationTxHash: ipRegistration.txHash,
        licenseTerms: {
          commercialUse: pattern.licenseSettings.commercialUse,
          derivativeWorks: pattern.licenseSettings.derivativeWorks,
          attributionRequired: pattern.licenseSettings.attributionRequired,
          royaltyPercent: pattern.licenseSettings.royaltyPercent,
        },
        isRegistered: true,
      };

      // Update pattern (note: in React, you'd typically do this via state management)
      pattern.storyProtocol = metadata;
      pattern.ipId = ipRegistration.ipId;

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

      // Convert terms to standardized format
      const standardTerms = {
        commercial: terms.commercial || terms.commercialUse || false,
        derivatives: terms.derivatives || terms.derivativeWorks || false,
        attribution: terms.attribution || terms.attributionRequired || true,
        royaltyPercentage: terms.royaltyPercentage || terms.royaltyPercent || 0,
      };
      
      await storyHook.setLicensingTerms(ipId, standardTerms);

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
              licenseTerms: {
                commercialUse: false,
                derivativeWorks: false,
                attributionRequired: true,
                royaltyPercent: 0,
              },
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
          commercialUse: pattern.licenseSettings.commercialUse,
          derivativeWorks: pattern.licenseSettings.derivativeWorks,
          attributionRequired: pattern.licenseSettings.attributionRequired,
          royaltyPercent: pattern.licenseSettings.royaltyPercent,
        };
      }

      const ipId = pattern.ipId || pattern.storyProtocol?.ipId;
      
      if (!ipId) {
        throw new Error("IP ID not found");
      }

      try {
        const ipAsset = await storyHook.getIPAsset(ipId);
        
        // Update pattern metadata with license information from IP asset
        if (ipAsset) {
          // Create standardized license terms from what's available in the IP asset
          // Create standardized license terms
          const licenseTerms = {
            commercialUse: false,
            derivativeWorks: false,
            attributionRequired: true,
            royaltyPercent: 0,
          };
          
          // Update pattern metadata
          if (pattern.storyProtocol) {
            pattern.storyProtocol.licenseTerms = licenseTerms;
          }
          
          return licenseTerms;
        }
        
        // Fallback to pattern license settings
        return {
          commercialUse: pattern.licenseSettings.commercialUse,
          derivativeWorks: pattern.licenseSettings.derivativeWorks,
          attributionRequired: pattern.licenseSettings.attributionRequired,
          royaltyPercent: pattern.licenseSettings.royaltyPercent,
        };
      } catch (err) {
        console.error("Error getting license terms:", err);
        // Fallback to pattern license settings
        return {
          commercialUse: pattern.licenseSettings.commercialUse,
          derivativeWorks: pattern.licenseSettings.derivativeWorks,
          attributionRequired: pattern.licenseSettings.attributionRequired,
          royaltyPercent: pattern.licenseSettings.royaltyPercent,
        };
      }
    }
  };
}