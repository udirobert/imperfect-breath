import React, { useContext } from 'react';
import { LensContextType } from './LensProvider';

const LensContext = React.createContext<LensContextType | undefined>(undefined);

export const useLensContext = (): LensContextType => {
  const context = useContext(LensContext);
  if (context === undefined) {
    throw new Error('useLensContext must be used within a LensProvider');
  }
  return context;
};