/**
 * Premium Language System - Human-Centered Communication
 * 
 * ENHANCEMENT FIRST: Replaces all percentage-based language with premium alternatives
 * CLEAN: Single source of truth for all user-facing language
 * PREMIUM: Maintains luxury brand voice across all components
 */

// AGGRESSIVE CONSOLIDATION: Replace all percentage language
export const PREMIUM_LANGUAGE = {
  // Effectiveness levels (replaces percentages)
  effectiveness: {
    excellent: "Excellent results",
    great: "Great results", 
    good: "Good results",
    effective: "Highly effective",
    proven: "Proven technique"
  },

  // Success indicators (replaces success rates)
  success: {
    highest: "Outstanding success",
    high: "High success rate",
    good: "Good success rate",
    proven: "Proven results"
  },

  // Confidence levels (replaces confidence percentages)
  confidence: {
    perfect: "Perfect for you",
    excellent: "Excellent match",
    great: "Great match",
    good: "Good option",
    recommended: "Recommended"
  },

  // Quality indicators
  quality: {
    premium: "Premium quality",
    excellent: "Excellent quality",
    high: "High quality",
    good: "Good quality"
  },

  // User experience descriptors
  experience: {
    seamless: "Seamless experience",
    smooth: "Smooth experience", 
    intuitive: "Intuitive experience",
    effortless: "Effortless experience"
  },

  // Time-based benefits
  timing: {
    instant: "Instant relief",
    quick: "Quick relief",
    fast: "Fast results",
    immediate: "Immediate benefits"
  },

  // Context-aware badges
  contextual: {
    morning: "Morning boost",
    evening: "Evening calm",
    work: "Work break",
    stress: "Stress relief",
    energy: "Energy boost",
    sleep: "Sleep ready",
    focus: "Focus enhancer",
    recovery: "Rest & restore"
  }
} as const;

// CLEAN: Helper functions for consistent language application
export const getPremiumEffectiveness = (percentage: number): string => {
  if (percentage >= 95) return PREMIUM_LANGUAGE.effectiveness.excellent;
  if (percentage >= 90) return PREMIUM_LANGUAGE.effectiveness.great;
  if (percentage >= 80) return PREMIUM_LANGUAGE.effectiveness.good;
  if (percentage >= 70) return PREMIUM_LANGUAGE.effectiveness.effective;
  return PREMIUM_LANGUAGE.effectiveness.proven;
};

export const getPremiumSuccess = (percentage: number): string => {
  if (percentage >= 95) return PREMIUM_LANGUAGE.success.highest;
  if (percentage >= 90) return PREMIUM_LANGUAGE.success.high;
  if (percentage >= 80) return PREMIUM_LANGUAGE.success.good;
  return PREMIUM_LANGUAGE.success.proven;
};

export const getPremiumConfidence = (confidence: number, index: number = 0): string => {
  if (index === 0 && confidence >= 0.9) return PREMIUM_LANGUAGE.confidence.perfect;
  if (confidence >= 0.85) return PREMIUM_LANGUAGE.confidence.excellent;
  if (confidence >= 0.75) return PREMIUM_LANGUAGE.confidence.great;
  if (confidence >= 0.65) return PREMIUM_LANGUAGE.confidence.good;
  return PREMIUM_LANGUAGE.confidence.recommended;
};

// MODULAR: Context-aware badge generation
export const getContextualBadge = (
  context: {
    timeOfDay?: number;
    mood?: string;
    goal?: string;
    activity?: string;
    energyLevel?: number;
    stressLevel?: number;
  },
  patternId: string
): string => {
  const hour = context.timeOfDay || new Date().getHours();
  
  // Time-based contextual badges
  if (hour >= 6 && hour < 12 && patternId === "energy") {
    return PREMIUM_LANGUAGE.contextual.morning;
  }
  if (hour >= 18 && patternId === "relaxation") {
    return PREMIUM_LANGUAGE.contextual.evening;
  }
  if (hour >= 22 && patternId === "sleep") {
    return PREMIUM_LANGUAGE.contextual.sleep;
  }
  
  // Context-specific badges
  if (context.energyLevel && context.energyLevel <= 2 && patternId === "energy") {
    return PREMIUM_LANGUAGE.contextual.energy;
  }
  
  if (context.stressLevel && context.stressLevel >= 4 && patternId === "box") {
    return PREMIUM_LANGUAGE.contextual.stress;
  }
  
  if (context.activity === "work" && patternId === "box") {
    return PREMIUM_LANGUAGE.contextual.work;
  }
  
  // Goal-based badges
  if (context.goal === "focus") {
    return PREMIUM_LANGUAGE.contextual.focus;
  }
  
  // Default to confidence-based
  return PREMIUM_LANGUAGE.confidence.recommended;
};

// PREMIUM: Luxury descriptors for enhanced UX
export const LUXURY_DESCRIPTORS = {
  patterns: {
    curated: "Expertly curated",
    personalized: "Personally tailored", 
    adaptive: "Intelligently adaptive",
    premium: "Premium collection"
  },
  
  experience: {
    immersive: "Immersive experience",
    guided: "Expert guidance",
    intelligent: "AI-powered insights",
    seamless: "Seamlessly integrated"
  },
  
  results: {
    transformative: "Transformative results",
    profound: "Profound benefits",
    lasting: "Lasting improvements",
    immediate: "Immediate impact"
  }
} as const;

export default PREMIUM_LANGUAGE;