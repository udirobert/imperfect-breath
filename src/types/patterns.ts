import { BreathingPhase, CustomBreathingPhase } from "../lib/breathingPatterns";
import { CustomPattern } from "../lib/patternStorage";

// Re-export the base pattern and phase types for convenience
export type { CustomPattern, BreathingPhase, CustomBreathingPhase };

// Enhanced pattern interfaces for the creator ecosystem
export interface MediaContent {
  type: "audio" | "video" | "image";
  url: string;
  title?: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
}

export interface LicenseSettings {
  price: number;
  currency: "ETH" | "USDC";
  derivativeWorks: boolean;
  attributionRequired: boolean;
  commercialUse: boolean;
  royaltyPercent: number;
}

export interface StoryProtocolMetadata {
  ipId?: string; // The ID of the IP asset on Story Protocol
  registrationTxHash?: string; // Transaction hash of IP registration
  licenseTerms?: {
    commercialUse: boolean;
    derivativeWorks: boolean;
    attributionRequired: boolean;
    royaltyPercent: number;
  };
  isRegistered: boolean; // Whether this pattern is registered on Story Protocol
}

// Methods for Story Protocol integration
export interface StoryProtocolMethods {
  register: () => Promise<StoryProtocolMetadata>;
  setLicenseTerms: (terms: Record<string, unknown>) => Promise<boolean>;
  checkRegistrationStatus: () => Promise<boolean>;
  getLicenseTerms: () => Promise<Record<string, unknown>>;
}

export interface BenefitClaim {
  id: string;
  title: string;
  description: string;
  evidenceLevel: "scientific" | "anecdotal" | "traditional";
  sources?: string[];
}

import { Json } from "../integrations/supabase/types";

export interface EnhancedCustomPattern extends CustomPattern {
  // Base pattern properties
  id: string;
  name: string;
  description: string;
  category: "stress" | "sleep" | "energy" | "focus" | "performance";
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  creator: string;
  phases: CustomBreathingPhase[];
  // Media content as a structured JSON object
  mediaContent?: Json;

  // Enhanced metadata
  tags: string[];
  targetAudience: string[];
  expectedDuration?: number; // in minutes
  sessionCount?: number; // recommended sessions per week

  // Benefits and claims
  primaryBenefits: BenefitClaim[];
  secondaryBenefits: string[];

  // Instructor information
  instructorName: string;
  instructorBio?: string;
  instructorCredentials: string[];
  instructorAvatar?: string;

  // Licensing
  licenseSettings: LicenseSettings;

  // Story Protocol integration
  ipId?: string; // The ID of the IP asset on Story Protocol
  storyProtocol?: StoryProtocolMetadata;
  blockchainMethods?: StoryProtocolMethods;

  // Advanced features
  hasProgressTracking?: boolean;
  hasAIFeedback?: boolean;
  customInstructions?: string;
  preparationNotes?: string;
  postSessionNotes?: string;
}

// Default values
export const defaultBenefit: BenefitClaim = {
  id: Date.now().toString(),
  title: "",
  description: "",
  evidenceLevel: "anecdotal",
};

export const defaultLicense: LicenseSettings = {
  price: 0,
  currency: "ETH",
  derivativeWorks: false,
  attributionRequired: true,
  commercialUse: false,
  royaltyPercent: 10,
};

// Utility function to convert CustomPattern to EnhancedCustomPattern
export const enhancePattern = (
  pattern: CustomPattern,
): EnhancedCustomPattern => {
  return {
    ...pattern,
    // Initialize with empty or default values
    mediaContent: pattern.mediaContent || {},
    tags: [],
    targetAudience: [],
    primaryBenefits: [],
    secondaryBenefits: [],
    instructorName: pattern.creator, // This should be fetched from a user profile in a real app
    instructorCredentials: [],
    licenseSettings:
      (pattern.licensingInfo as unknown as LicenseSettings) || defaultLicense,

    // Story Protocol defaults
    ipId: undefined,
    storyProtocol: {
      isRegistered: false,
    },

    // Default advanced features to false
    hasProgressTracking: false,
    hasAIFeedback: false,
  };
};
