// Let me create a clean version of the essential parts
import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceProfile {
  enableBatterySaver: boolean;
  animationQuality: 'high' | 'medium' | 'minimal';
  visionProcessingLevel: 'full' | 'reduced' | 'minimal';
}

export interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  supportsWebGL: boolean;
  maxTextureSize: number;
}

const useAdaptivePerformance = () => {
  const [profile, setProfile] = useState<PerformanceProfile>({
    enableBatterySaver: false,
    animationQuality: 'high',
    visionProcessingLevel: 'full',
  });

  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isLowEnd: false,
    supportsWebGL: true,
    maxTextureSize: 2048,
  });

  // Initialize capabilities
  useEffect(() => {
    const detectCapabilities = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      const isLowEnd = navigator.hardwareConcurrency <= 2 || (navigator as any).deviceMemory <= 2;
      
      setCapabilities({
        isMobile,
        isLowEnd,
        supportsWebGL: true,
        maxTextureSize: 2048,
      });
    };

    detectCapabilities();
  }, []);

  const adjustQuality = useCallback((level: 'high' | 'medium' | 'low') => {
    setProfile(prev => ({
      ...prev,
      animationQuality: level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'minimal',
      visionProcessingLevel: level === 'high' ? 'full' : level === 'medium' ? 'reduced' : 'minimal',
    }));
  }, []);

  return {
    profile,
    capabilities,
    adjustQuality,
    isMobileOptimized: capabilities.isMobile,
    isLowEndDevice: capabilities.isLowEnd,
    shouldUseBatterySaver: profile.enableBatterySaver,
  };
};

export function useIsMobile(): boolean {
  const { capabilities } = useAdaptivePerformance();
  return capabilities.isMobile;
}

export default useAdaptivePerformance;