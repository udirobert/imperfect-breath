/**
 * Mobile Optimization Hook
 * Provides mobile-specific optimizations and responsive behavior
 */

import { useState, useEffect, useCallback } from 'react';
import { OrientationManager } from '../lib/mobile/orientation-manager';

interface MobileOptimizationConfig {
  enableOrientationLock?: boolean;
  preferredOrientation?: 'portrait' | 'landscape' | 'auto';
  adaptiveLayout?: boolean;
  optimizePerformance?: boolean;
  enableHapticFeedback?: boolean;
}

interface MobileOptimizationState {
  isMobile: boolean;
  isTablet: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: 'small' | 'medium' | 'large';
  hasTouch: boolean;
  supportsOrientationLock: boolean;
  supportsFullscreen: boolean;
  isFullscreen: boolean;
  layoutConfig: {
    orientation: 'portrait' | 'landscape';
    containerClass: string;
    videoAspectRatio: string;
    controlsPosition: 'bottom' | 'side';
    showFullControls: boolean;
  };
}

interface MobileOptimizationReturn {
  // State
  state: MobileOptimizationState;
  
  // Actions
  lockOrientation: (orientation: 'portrait' | 'landscape') => Promise<boolean>;
  unlockOrientation: () => boolean;
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<boolean>;
  triggerHapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void;
  
  // Session management
  startMobileSession: () => void;
  endMobileSession: () => void;
  
  // Configuration
  updateConfig: (config: Partial<MobileOptimizationConfig>) => void;
}

const DEFAULT_CONFIG: MobileOptimizationConfig = {
  enableOrientationLock: true,
  preferredOrientation: 'auto',
  adaptiveLayout: true,
  optimizePerformance: true,
  enableHapticFeedback: true,
};

export const useMobileOptimization = (
  initialConfig: Partial<MobileOptimizationConfig> = {}
): MobileOptimizationReturn => {
  const [config, setConfig] = useState<MobileOptimizationConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  
  const [state, setState] = useState<MobileOptimizationState>(() => {
    const orientationManager = OrientationManager.getInstance();
    const deviceInfo = orientationManager.getDeviceInfo();
    const layoutConfig = orientationManager.getLayoutConfig();
    const orientationState = orientationManager.getState();
    
    return {
      isMobile: deviceInfo.type === 'mobile',
      isTablet: deviceInfo.type === 'tablet',
      orientation: orientationState.current,
      screenSize: deviceInfo.screenSize,
      hasTouch: deviceInfo.hasTouch,
      supportsOrientationLock: deviceInfo.supportsOrientationLock,
      supportsFullscreen: deviceInfo.supportsFullscreen,
      isFullscreen: !!document.fullscreenElement,
      layoutConfig,
    };
  });

  // Subscribe to orientation changes
  useEffect(() => {
    const orientationManager = OrientationManager.getInstance();
    
    const unsubscribe = orientationManager.subscribe((orientationState) => {
      const deviceInfo = orientationManager.getDeviceInfo();
      const layoutConfig = orientationManager.getLayoutConfig();
      
      setState(prev => ({
        ...prev,
        orientation: orientationState.current,
        layoutConfig,
        screenSize: deviceInfo.screenSize,
      }));
    });

    return unsubscribe;
  }, []);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState(prev => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Apply mobile optimizations
  useEffect(() => {
    if (config.optimizePerformance && (state.isMobile || state.isTablet)) {
      applyPerformanceOptimizations();
    }
  }, [config.optimizePerformance, state.isMobile, state.isTablet]);

  /**
   * Apply performance optimizations for mobile devices
   */
  const applyPerformanceOptimizations = useCallback(() => {
    // Disable smooth scrolling on mobile for better performance
    document.documentElement.style.scrollBehavior = 'auto';
    
    // Optimize touch actions
    document.body.style.touchAction = 'manipulation';
    
    // Prevent overscroll
    document.body.style.overscrollBehavior = 'none';
    
    // Optimize rendering
    const metaTag = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (metaTag) {
      metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
  }, []);

  /**
   * Lock device orientation
   */
  const lockOrientation = useCallback(async (orientation: 'portrait' | 'landscape'): Promise<boolean> => {
    if (!config.enableOrientationLock || !state.supportsOrientationLock) {
      return false;
    }

    const orientationManager = OrientationManager.getInstance();
    return orientationManager.lockOrientation(orientation);
  }, [config.enableOrientationLock, state.supportsOrientationLock]);

  /**
   * Unlock device orientation
   */
  const unlockOrientation = useCallback((): boolean => {
    const orientationManager = OrientationManager.getInstance();
    return orientationManager.unlockOrientation();
  }, []);

  /**
   * Enter fullscreen mode
   */
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    if (!state.supportsFullscreen || state.isFullscreen) {
      return false;
    }

    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch (error) {
      console.warn('Failed to enter fullscreen:', error);
      return false;
    }
  }, [state.supportsFullscreen, state.isFullscreen]);

  /**
   * Exit fullscreen mode
   */
  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    if (!state.isFullscreen) {
      return false;
    }

    try {
      await document.exitFullscreen();
      return true;
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error);
      return false;
    }
  }, [state.isFullscreen]);

  /**
   * Trigger haptic feedback
   */
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!config.enableHapticFeedback || !('vibrate' in navigator)) {
      return;
    }

    // Haptic feedback patterns
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
    };

    try {
      navigator.vibrate(patterns[type]);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }, [config.enableHapticFeedback]);

  /**
   * Start mobile session with optimizations
   */
  const startMobileSession = useCallback(() => {
    const orientationManager = OrientationManager.getInstance();
    orientationManager.setSessionActive(true);
    
    // Apply session-specific optimizations
    if (config.enableOrientationLock && config.preferredOrientation !== 'auto') {
      lockOrientation(config.preferredOrientation);
    }
    
    // Prevent device sleep during session
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch((error: any) => {
        console.warn('Wake lock not supported:', error);
      });
    }
    
    // Hide address bar on mobile
    if (state.isMobile) {
      setTimeout(() => {
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 0), 100);
      }, 500);
    }
    
    triggerHapticFeedback('light');
  }, [config, lockOrientation, state.isMobile, triggerHapticFeedback]);

  /**
   * End mobile session
   */
  const endMobileSession = useCallback(() => {
    const orientationManager = OrientationManager.getInstance();
    orientationManager.setSessionActive(false);
    
    // Unlock orientation
    unlockOrientation();
    
    // Exit fullscreen if active
    if (state.isFullscreen) {
      exitFullscreen();
    }
    
    triggerHapticFeedback('medium');
  }, [unlockOrientation, exitFullscreen, state.isFullscreen, triggerHapticFeedback]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<MobileOptimizationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    // Update orientation manager config
    const orientationManager = OrientationManager.getInstance();
    orientationManager.updateConfig({
      enableAutoRotation: newConfig.enableOrientationLock !== false,
      preferredOrientation: newConfig.preferredOrientation || 'auto',
      adaptiveLayout: newConfig.adaptiveLayout !== false,
    });
  }, []);

  return {
    // State
    state,
    
    // Actions
    lockOrientation,
    unlockOrientation,
    enterFullscreen,
    exitFullscreen,
    triggerHapticFeedback,
    
    // Session management
    startMobileSession,
    endMobileSession,
    
    // Configuration
    updateConfig,
  };
};