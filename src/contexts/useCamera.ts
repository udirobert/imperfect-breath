import React, { useContext } from 'react';
import { CameraContextType } from './CameraContext';

const CameraContext = React.createContext<CameraContextType | undefined>(undefined);

// Hook to use camera context
export const useCamera = (): CameraContextType => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};