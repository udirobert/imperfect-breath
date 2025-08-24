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

  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isLowPowerMode, setIsLowPowerMode] = useState<boolean>(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');

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

  // Monitor battery status
  useEffect(() => {
    const updateBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          setIsLowPowerMode(battery.level < 0.2);

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
            setIsLowPowerMode(battery.level < 0.2);
          });
        } catch (error) {
          // Battery API not supported, use defaults
          setBatteryLevel(100);
          setIsLowPowerMode(false);
        }
      }
    };

    updateBatteryInfo();
  }, []);

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      if (navigator.onLine) {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
          const effectiveType = connection.effectiveType;
          setNetworkStatus(effectiveType === 'slow-2g' || effectiveType === '2g' ? 'slow' : 'online');
        } else {
          setNetworkStatus('online');
        }
      } else {
        setNetworkStatus('offline');
      }
    };

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const adjustQuality = useCallback((level: 'high' | 'medium' | 'low') => {
    setProfile(prev => ({
      ...prev,
      animationQuality: level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'minimal',
      visionProcessingLevel: level === 'high' ? 'full' : level === 'medium' ? 'reduced' : 'minimal',
    }));
  }, []);

  // Determine performance level based on capabilities
  const performanceLevel: 'low' | 'medium' | 'high' = capabilities.isLowEnd ? 'low' :
    (capabilities.supportsWebGL && !capabilities.isMobile) ? 'high' : 'medium';

  return {
    profile,
    capabilities,
    adjustQuality,
    isMobileOptimized: capabilities.isMobile,
    isLowEndDevice: capabilities.isLowEnd,
    shouldUseBatterySaver: profile.enableBatterySaver,
    // Additional properties for desktop components
    performanceLevel,
    batteryLevel,
    isLowPowerMode,
    networkStatus,
  };
};

export function useIsMobile(): boolean {
  const { capabilities } = useAdaptivePerformance();
  return capabilities.isMobile;
}

// Export both as named and default export for compatibility
export { useAdaptivePerformance };
export default useAdaptivePerformance;