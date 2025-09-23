import React, { createContext, useContext } from 'react';
import { useCameraStore } from '../stores/cameraStore';

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
  // Use the Zustand store for all camera state management
  const store = useCameraStore();

  const value = {
    stream: store.stream,
    status: store.status,
    error: store.error,
    requestStream: store.requestStream,
    releaseStream: store.releaseStream,
    hasPermission: store.hasPermission,
    devices: store.devices,
    refreshDevices: store.refreshDevices
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