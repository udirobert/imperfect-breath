/**
 * Auth Orchestrator Hook
 *
 * Minimal scaffolding to sync Supabase auth and wallet state into the
 * unified AuthSession store. Non-invasive; complements existing useAuth.
 */

import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { useWalletStatus } from './useWallet';
import { useRevenueCatSync } from './useRevenueCatSync';

export const useAuthOrchestrator = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setWallet = useAuthStore((s) => s.setWallet);

  const wallet = useWalletStatus();
  
  // Sync RevenueCat subscription status
  useRevenueCatSync();

  // Sync wallet state into store
  useEffect(() => {
    setWallet(wallet.address ?? null, wallet.chainId ?? null, wallet.isConnected);
  }, [wallet.address, wallet.chainId, wallet.isConnected, setWallet]);

  // Subscribe to Supabase auth changes and reflect into store
  useEffect(() => {
    setLoading(true);
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, [setSession, setLoading]);

  // Expose the full store state for consumers
  return useAuthStore();
};