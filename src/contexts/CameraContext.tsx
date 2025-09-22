import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error' | 'permission-denied';

export interface CameraContextType {
  stream: MediaStream | null;
  status: CameraStatus;
  error: string | null;
  requestStream: () => Promise<MediaStream | null>;
  releaseStream: () => void;
  hasPermission: boolean;
  devices: MediaDeviceInfo[];
  refreshDevices: () => Promise<void>;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const refCount = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Check initial permission status
  useEffect(() => {
    const checkPermission = async () => {
      if (!navigator.permissions) return;
      
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasPermission(permission.state === 'granted');
        
        permission.addEventListener('change', () => {
          setHasPermission(permission.state === 'granted');
        });
      } catch (err) {
        console.warn('Permission check failed:', err);
      }
    };

    checkPermission();
  }, []);

  // Refresh available devices
  const refreshDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
    }
  }, []);

  // Request camera stream
  const requestStream = useCallback(async (): Promise<MediaStream | null> => {
    // If we already have an active stream, return it
    if (streamRef.current && status === 'active') {
      refCount.current++;
      console.log(`📹 CameraContext: Stream reused, refCount: ${refCount.current}`);
      return streamRef.current;
    }

    // If already requesting, wait for the existing request
    if (status === 'requesting') {
      // Wait for status to change from requesting
      return new Promise((resolve) => {
        const checkStatus = () => {
          if (status !== 'requesting') {
            resolve(streamRef.current);
          } else {
            setTimeout(checkStatus, 100);
          }
        };
        checkStatus();
      });
    }

    setStatus('requesting');
    setError(null);

    try {
      console.log('📷 CameraContext: Requesting new camera stream...');
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });

      streamRef.current = newStream;
      setStream(newStream);
      setStatus('active');
      setHasPermission(true);
      refCount.current++;
      
      console.log(`✅ CameraContext: Stream acquired, refCount: ${refCount.current}`);
      
      // Refresh devices now that we have permission
      await refreshDevices();
      
      return newStream;
    } catch (err) {
      console.error('❌ CameraContext: Camera request failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      if (err.name === 'NotAllowedError') {
        setStatus('permission-denied');
        setHasPermission(false);
      } else {
        setStatus('error');
      }
      
      return null;
    }
  }, [status, refreshDevices]);

  // Release camera stream reference
  const releaseStream = useCallback(() => {
    refCount.current = Math.max(0, refCount.current - 1);
    console.log(`📹 CameraContext: Stream reference released, refCount: ${refCount.current}`);
    
    // Only stop the actual stream when no references remain
    if (refCount.current <= 0 && streamRef.current) {
      console.log('🛑 CameraContext: Stopping camera stream (no references remaining)');
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
      setStatus('idle');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 CameraContext: Cleaning up on unmount');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  const value = {
    stream,
    status,
    error,
    requestStream,
    releaseStream,
    hasPermission,
    devices,
    refreshDevices
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};

// Hook to use camera context
export const useCamera = (): CameraContextType => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};