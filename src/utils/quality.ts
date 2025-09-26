/**
 * QUALITY UTILITIES
 * 
 * SINGLE SOURCE OF TRUTH for all quality-related calculations and formatting.
 * Extracted from hooks to follow DRY principle and improve organization.
 * 
 * Core Principles Applied:
 * - DRY: Single source for quality logic
 * - CLEAN: Pure functions with clear responsibilities  
 * - MODULAR: Testable, independent utility functions
 * - ORGANIZED: Domain-driven utility organization
 */

import type { QualityLevel } from '../types/metrics';

// ============================================================================
// QUALITY ASSESSMENT - Score to quality level mapping
// ============================================================================

/**
 * Convert numeric score to quality level
 * DRY: Single source for quality thresholds
 */
export const getQualityLevel = (score: number): QualityLevel => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'needs_focus';
  return 'getting_started';
};

/**
 * Get human-readable quality label
 * DRY: Single source for quality descriptions
 */
export const getQualityLabel = (score: number): string => {
  const level = getQualityLevel(score);
  
  const labels: Record<QualityLevel, string> = {
    excellent: 'Excellent',
    good: 'Good', 
    fair: 'Fair',
    needs_focus: 'Needs Focus',
    getting_started: 'Getting Started',
  };
  
  return labels[level];
};

/**
 * Get quality-appropriate color class
 * DRY: Single source for quality colors
 */
export const getQualityColor = (score: number): string => {
  const level = getQualityLevel(score);
  
  const colors: Record<QualityLevel, string> = {
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-yellow-400', 
    needs_focus: 'text-orange-400',
    getting_started: 'text-red-400',
  };
  
  return colors[level];
};

/**
 * Get quality-appropriate background color class
 * MODULAR: Additional color variant for different UI contexts
 */
export const getQualityBgColor = (score: number): string => {
  const level = getQualityLevel(score);
  
  const bgColors: Record<QualityLevel, string> = {
    excellent: 'bg-green-100 dark:bg-green-900/20',
    good: 'bg-blue-100 dark:bg-blue-900/20',
    fair: 'bg-yellow-100 dark:bg-yellow-900/20',
    needs_focus: 'bg-orange-100 dark:bg-orange-900/20', 
    getting_started: 'bg-red-100 dark:bg-red-900/20',
  };
  
  return bgColors[level];
};

/**
 * Get quality-appropriate border color class
 * MODULAR: Border variant for card/container styling
 */
export const getQualityBorderColor = (score: number): string => {
  const level = getQualityLevel(score);
  
  const borderColors: Record<QualityLevel, string> = {
    excellent: 'border-green-200 dark:border-green-700',
    good: 'border-blue-200 dark:border-blue-700',
    fair: 'border-yellow-200 dark:border-yellow-700',
    needs_focus: 'border-orange-200 dark:border-orange-700',
    getting_started: 'border-red-200 dark:border-red-700',
  };
  
  return borderColors[level];
};

// ============================================================================
// QUALITY CALCULATIONS - Score processing and normalization
// ============================================================================

/**
 * Calculate overall quality score from multiple metrics
 * CLEAN: Pure function for quality aggregation
 */
export const calculateOverallQuality = (metrics: {
  stillness?: number;
  presence?: number;
  posture?: number;
  consistency?: number;
}): number => {
  const values = Object.values(metrics).filter((v): v is number => 
    typeof v === 'number' && !isNaN(v)
  );
  
  if (values.length === 0) return 0;
  
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
};

/**
 * Normalize score to 0-100 range
 * CLEAN: Utility for score normalization
 */
export const normalizeScore = (score: number, min = 0, max = 100): number => {
  return Math.max(min, Math.min(max, Math.round(score)));
};

/**
 * Calculate stillness score from restlessness
 * DRY: Single source for stillness calculation
 */
export const calculateStillnessFromRestlessness = (restlessness: number): number => {
  return normalizeScore(100 - restlessness);
};

/**
 * Get quality improvement suggestion
 * MODULAR: Contextual feedback based on score
 */
export const getQualityImprovement = (score: number): string => {
  const level = getQualityLevel(score);
  
  const suggestions: Record<QualityLevel, string> = {
    excellent: 'Maintain this excellent focus and stillness!',
    good: 'Great progress! Try to minimize small movements.',
    fair: 'Focus on finding a comfortable, stable position.',
    needs_focus: 'Take a moment to settle and center yourself.',
    getting_started: 'Relax and focus on your breathing rhythm.',
  };
  
  return suggestions[level];
};

// ============================================================================
// QUALITY FORMATTING - Display formatting utilities
// ============================================================================

/**
 * Format score with percentage
 * CLEAN: Consistent score formatting
 */
export const formatScore = (score: number): string => {
  return `${normalizeScore(score)}%`;
};

/**
 * Format quality with label and score
 * MODULAR: Combined formatting for UI display
 */
export const formatQualityWithScore = (score: number): string => {
  return `${getQualityLabel(score)} (${formatScore(score)})`;
};

/**
 * Get quality emoji indicator
 * LUXURY: Visual quality indicator for enhanced UX
 */
export const getQualityEmoji = (score: number): string => {
  const level = getQualityLevel(score);
  
  const emojis: Record<QualityLevel, string> = {
    excellent: '🌟',
    good: '⭐',
    fair: '💫', 
    needs_focus: '🌱',
    getting_started: '🌿',
  };
  
  return emojis[level];
};

// ============================================================================
// EXPORTS - Clean, organized exports
// ============================================================================

export default {
  // Core functions
  getQualityLevel,
  getQualityLabel,
  getQualityColor,
  
  // Color variants
  getQualityBgColor,
  getQualityBorderColor,
  
  // Calculations
  calculateOverallQuality,
  normalizeScore,
  calculateStillnessFromRestlessness,
  
  // Formatting
  formatScore,
  formatQualityWithScore,
  getQualityEmoji,
  
  // Feedback
  getQualityImprovement,
};