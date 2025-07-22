/**
 * Modern Breathing Session Hook
 * 
 * Direct export of the enhanced session system.
 * This maintains backward compatibility while using the modern implementation.
 */

export { 
  useEnhancedSession as useBreathingSession,
  useSessionStatus,
  useSessionControls,
  useReadySession
} from './useEnhancedSession';

// Re-export types for backward compatibility
export type { 
  UseEnhancedSessionConfig as UseBreathingSessionConfig,
  UseEnhancedSessionReturn as UseBreathingSessionReturn
} from './useEnhancedSession';