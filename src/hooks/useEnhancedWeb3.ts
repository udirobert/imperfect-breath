/**
 * Enhanced Web3 Hook
 * Extracted from EnhancedWeb3Provider to fix Fast Refresh warnings
 */

import { useContext } from "react";
import { EnhancedWeb3Context } from "../providers/EnhancedWeb3Provider";

export const useEnhancedWeb3 = () => {
  const context = useContext(EnhancedWeb3Context);
  if (!context) {
    throw new Error("useEnhancedWeb3 must be used within EnhancedWeb3Provider");
  }
  return context;
};
