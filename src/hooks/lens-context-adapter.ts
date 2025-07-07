// This is an adapter file to work around JSX import issues
// It re-exports the useLensContext hook and provides v3 compatibility functions

// @ts-ignore - Ignoring JSX configuration error
import { useLensContext as originalUseLensContext } from "../providers/LensProvider";
import { LensContextType } from "./lens-types";
import type { LensAccount } from '../lib/lens/types';

/**
 * Hook to access the Lens context without JSX configuration issues
 */
export const useLensContext = (): LensContextType => {
  // @ts-ignore - Ignoring potential type mismatch
  return originalUseLensContext();
};

/**
 * Adapts a Lens v3 account structure to match expected profile structure
 * used elsewhere in the application
 */
export const adaptLensAccountToProfile = (account: LensAccount | null) => {
  if (!account) return null;
  
  return {
    displayName: account.name || account.username,
    username: account.username,
    picture: account.picture, // picture is a simple string in the LensAccount type
    address: account.address,
  };
};

/**
 * Extracts the most reliable user identifier from a Lens account
 */
export const getLensUserId = (account: LensAccount | null): string | null => {
  if (!account) return null;
  return account.address || null;
};

/**
 * Formats a Lens handle/username for display
 */
export const formatLensUsername = (username: string | null | undefined): string => {
  if (!username) return '';
  return username.startsWith('@') ? username : `@${username}`;
};