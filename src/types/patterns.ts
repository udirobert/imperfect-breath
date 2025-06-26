import { BreathingPhase, CustomBreathingPhase } from "@/lib/breathingPatterns";
import { CustomPattern } from "@/lib/patternStorage";

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
  isCommercial: boolean;
  price: number;
  currency: "ETH" | "USDC";
  allowDerivatives: boolean;
  attribution: boolean;
  commercialUse: boolean;
  royaltyPercentage: number;
}

export interface BenefitClaim {
  id: string;
  title: string;
  description: string;
  evidenceLevel: "scientific" | "anecdotal" | "traditional";
  sources?: string[];
}

import { Json } from "@/integrations/supabase/types";

export interface EnhancedCustomPattern extends CustomPattern {
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
  isCommercial: false,
  price: 0,
  currency: "ETH",
  allowDerivatives: false,
  attribution: true,
  commercialUse: false,
  royaltyPercentage: 10,
};

// Utility function to convert CustomPattern to EnhancedCustomPattern
export const enhancePattern = (pattern: CustomPattern): EnhancedCustomPattern => {
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
    licenseSettings: (pattern.licensingInfo as unknown as LicenseSettings) || defaultLicense,
    
    // Default advanced features to false
    hasProgressTracking: false,
    hasAIFeedback: false,
  };
};