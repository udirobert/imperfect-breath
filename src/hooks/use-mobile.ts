import { useEffect, useState } from 'react';
import { isTouchDevice } from '@/utils/mobile-detection';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(isTouchDevice());
    };

    // Check on mount
    checkIsMobile();

    // Add event listeners for resize/orientation change
    window.addEventListener('resize', checkIsMobile);
    window.addEventListener('orientationchange', checkIsMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIsMobile);
      window.removeEventListener('orientationchange', checkIsMobile);
    };
  }, []);

  return isMobile;
}