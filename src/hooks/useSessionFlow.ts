/**
 * Session Flow Hook - Centralizes session routing logic
 * Restores DRY, CLEAN, ORGANISED, MODULAR principles
 */

import { useLocation } from 'react-router-dom';
import { useIsMobile } from './use-mobile';

export type SessionMode = 'quick' | 'enhanced' | 'classic' | 'mobile';

interface SessionFlowConfig {
  mode: SessionMode;
  shouldBypassSetup: boolean;
  useEnhancedVision: boolean;
  useMobileInterface: boolean;
  defaultPattern?: string;
}

/**
 * Centralized session flow logic - single source of truth
 */
export const useSessionFlow = (): SessionFlowConfig => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Parse all session parameters in one place
  const urlParams = new URLSearchParams(location.search);
  const isQuickStart = urlParams.get('quick') === 'true';
  const isEnhanced = urlParams.get('enhanced') === 'true' || 
                    localStorage.getItem('preferEnhancedVision') === 'true';
  
  // Determine session mode based on context
  const mode: SessionMode = (() => {
    if (isQuickStart) return 'quick';
    if (isEnhanced) return 'enhanced';
    if (isMobile) return 'mobile';
    return 'classic';
  })();
  
  // Configure session behavior
  const config: SessionFlowConfig = {
    mode,
    shouldBypassSetup: isQuickStart,
    useEnhancedVision: isEnhanced,
    useMobileInterface: isMobile && !isEnhanced, // Enhanced takes precedence
    defaultPattern: isQuickStart ? 'box-breathing' : undefined,
  };
  
  return config;
};

/**
 * Clean up session flags after use
 */
export const cleanupSessionFlags = () => {
  localStorage.removeItem('quickStartMode');
};