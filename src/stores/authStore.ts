/**
 * Unified Auth Session Store
 *
 * SINGLE SOURCE OF TRUTH for authentication/session state across providers.
 * Clean, modular, DRY. Minimal persistence (in-memory) to avoid stale sessions.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Session } from '@supabase/supabase-js';
import type { User as AppUser } from '../types/blockchain';

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
}

export interface LensState {
  isAuthenticated: boolean;
}

export interface RevenueCatState {
  isAvailable: boolean;
  isLoggedIn: boolean;
  subscriptionTier: 'basic' | 'premium' | 'pro';
  isSubscriptionActive: boolean;
  features: string[];
}

export interface SiweState {
  verified: boolean;
  jwt: string | null;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastUpdated: number | null;
}

export interface AuthSession {
  session: Session | null;
  userId: string | null;
  profile: AppUser | null;
  wallet: WalletState;
  lens: LensState;
  revenueCat: RevenueCatState;
  siwe: SiweState;
  status: AuthStatus;
}

export interface AuthActions {
  setSession: (session: Session | null) => void;
  setProfile: (profile: AppUser | null) => void;
  setWallet: (address: string | null, chainId: string | null, isConnected: boolean) => void;
  setLensAuthenticated: (auth: boolean) => void;
  setRevenueCatState: (isAvailable: boolean, isLoggedIn: boolean, subscriptionTier?: 'basic' | 'premium' | 'pro', isSubscriptionActive?: boolean, features?: string[]) => void;
  setSiweState: (verified: boolean, jwt: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

const initialState: AuthSession = {
  session: null,
  userId: null,
  profile: null,
  wallet: { address: null, chainId: null, isConnected: false },
  lens: { isAuthenticated: false },
  revenueCat: { 
    isAvailable: false, 
    isLoggedIn: false, 
    subscriptionTier: 'basic', 
    isSubscriptionActive: true, 
    features: [] 
  },
  siwe: { verified: false, jwt: null },
  status: { isAuthenticated: false, isLoading: true, lastUpdated: null },
};

export const useAuthStore = create<AuthSession & AuthActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    setSession: (session) => {
      set({
        session,
        userId: session?.user?.id ?? null,
        status: {
          ...get().status,
          isAuthenticated: !!session?.user?.id,
          lastUpdated: Date.now(),
        },
      });
    },
    setProfile: (profile) => {
      set({ profile, status: { ...get().status, lastUpdated: Date.now() } });
    },
    setWallet: (address, chainId, isConnected) => {
      set({ wallet: { address, chainId, isConnected }, status: { ...get().status, lastUpdated: Date.now() } });
    },
    setLensAuthenticated: (auth) => {
      set({ lens: { isAuthenticated: auth }, status: { ...get().status, lastUpdated: Date.now() } });
    },
    setRevenueCatState: (isAvailable, isLoggedIn, subscriptionTier = 'basic', isSubscriptionActive = true, features = []) => {
      set({ 
        revenueCat: { 
          isAvailable, 
          isLoggedIn, 
          subscriptionTier, 
          isSubscriptionActive, 
          features 
        }, 
        status: { ...get().status, lastUpdated: Date.now() } 
      });
    },
    setSiweState: (verified, jwt) => {
      set({ siwe: { verified, jwt }, status: { ...get().status, lastUpdated: Date.now() } });
    },
    setLoading: (isLoading) => {
      set({ status: { ...get().status, isLoading, lastUpdated: Date.now() } });
    },
    clear: () => {
      set({
        ...initialState,
        status: { isAuthenticated: false, isLoading: false, lastUpdated: Date.now() },
      });
    },
  }))
);

// Convenience selectors
export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useAuthProfile = () => useAuthStore((s) => s.profile);
export const useAuthWallet = () => useAuthStore((s) => s.wallet);
export const useSiweStatus = () => useAuthStore((s) => s.siwe);
export const useRevenueCatStatus = () => useAuthStore((s) => s.revenueCat);