/**
 * SHARED SESSION TYPES
 * 
 * CONSOLIDATED: Now re-exports from types/metrics.ts
 * This file maintained for backward compatibility during transition.
 */

// ORGANIZED: All types moved to types/metrics.ts for better organization
export type {
  SessionMetrics,
  SessionModeConfig,
  SessionPhase,
  SessionMode,
  BreathPhase,
  MeditationMetrics,
  StableMetricsResult,
  DisplayState,
  VisionStatus,
  PerformanceMode,
  MetricTrend,
  QualityLevel
} from './metrics';