/**
 * Meditation Session - Unified Session Component for All Modes
 * 
 * SINGLE PURPOSE: Provide one source of truth for all session types
 * CLEAN: Separates session state from UI presentation
 * MODULAR: Reusable across classic, enhanced, and mobile modes
 * PERFORMANT: Optimized for all device types
 */

import React, { useRef } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { useCamera } from '../../contexts/CameraContext';
import { useStableMetrics } from '../../hooks/useStableMetrics';
import { useSession } from '../../hooks/useSession';

import VideoFeed from '../VideoFeed';
import { VisionManager } from './VisionManager';
import BreathingAnimation from '../BreathingAnimation';
import { SessionControls } from './SessionControls';
import { EnhancedSessionLayout } from './EnhancedSessionLayout';

import { ResponsiveEnhancedSession } from './ResponsiveEnhancedSession';

// MEDIDATION SESSION CONFIGURATION INTERFACE
export interface MeditationSessionConfig {
  mode: 'classic' | 'enhanced' | 'mobile';
  pattern: {
    name: string;
    phases: {
      inhale: number;
      hold?: number;
      exhale: number;
      pause?: number;
    };
    difficulty: string;
    benefits: string[];
    description?: string;
  };
  autoStart: boolean;
  maxCycles?: number;
}

// MEDIDATION SESSION COMPONENT PROPS
interface MeditationSessionProps {
  config: MeditationSessionConfig;
  onSessionComplete: (metrics: any) => void;
  onSessionExit: () => void;
}

// EXPORT BOTH THE INTERFACE AND THE COMPONENT
export const MeditationSession: React.FC<MeditationSessionProps> = ({
  config,
  onSessionComplete,
  onSessionExit,
}) => {
  // For existing functionality, delegate to ResponsiveEnhancedSession
  // This maintains backward compatibility while providing the unified interface
  
  const isMobile = useIsMobile();
  
  // Map the MeditationSessionConfig to ResponsiveEnhancedSession props
  const responsiveConfig = {
    pattern: {
      name: config.pattern.name,
      phases: config.pattern.phases,
      benefits: config.pattern.benefits,
      description: config.pattern.description || `A ${config.pattern.difficulty} breathing technique with proven benefits.`
    },
    mode: config.mode,
  };
  
  const modeConfig = {
    enableCamera: config.mode !== 'classic',
    enableVision: config.mode === 'enhanced' || config.mode === 'mobile',
  };
  
  // Generate a session ID if needed
  const sessionId = `session_${Date.now()}`;
  
  // Delegate to the existing ResponsiveEnhancedSession component
  return (
    <ResponsiveEnhancedSession
      config={responsiveConfig}
      modeConfig={modeConfig}
      onSessionComplete={onSessionComplete}
      onSessionExit={onSessionExit}
      sessionId={sessionId}
    />
  );
};

export default MeditationSession;