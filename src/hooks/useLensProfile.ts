import { useState, useEffect } from "react";
import { publicClient } from "@/lib/publicClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from "@/lib/lens";
import {
  useModernLensAccount,
  ModernLensAccount,
} from "./useModernLensProfile";

export interface LensProfile {
  handle: string;
  imageURI: string;
  pubCount: number;
  profileId: number;
  followersCount: number;
  followingCount: number;
}

// Helper function to convert ModernLensAccount to legacy LensProfile format
const convertToLegacyProfile = (
  modernAccount: ModernLensAccount,
): LensProfile => {
  return {
    handle: modernAccount.username,
    imageURI: modernAccount.picture || "",
    pubCount: modernAccount.stats.posts,
    profileId: parseInt(modernAccount.id, 16) || 0, // Convert hex ID to number
    followersCount: modernAccount.stats.followers,
    followingCount: modernAccount.stats.following,
  };
};

type LensProfileData = {
  pubCount: bigint;
  followModule: string;
  followNFT: string;
  handle: string;
  imageURI: string;
  followNFTURI: string;
};

export const useLensProfile = () => {
  const { profile } = useAuth();
  const [lensProfile, setLensProfile] = useState<LensProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Try to use modern Lens V3 SDK first
  const {
    account: modernAccount,
    loading: modernLoading,
    error: modernError,
  } = useModernLensAccount();

  useEffect(() => {
    // First, try to use the modern Lens V3 SDK
    if (modernAccount && !modernError) {
      const legacyProfile = convertToLegacyProfile(modernAccount);
      setLensProfile(legacyProfile);
      setLoading(modernLoading);
      return;
    }

    // Fallback to legacy implementation if modern SDK fails or no profile found
    const fetchLensProfileLegacy = async () => {
      if (!profile?.wallet_address) {
        setLensProfile(null);
        return;
      }

      setLoading(true);
      try {
        // 1. Get the default profile ID for the wallet address
        const profileId = await publicClient.readContract({
          address: LENS_HUB_CONTRACT_ADDRESS,
          abi: LENS_HUB_ABI,
          functionName: "defaultProfile",
          args: [profile.wallet_address],
        });

        if (!profileId || Number(profileId) === 0) {
          setLensProfile(null);
          return;
        }

        // 2. Get the profile data using the profile ID
        const lensData = (await publicClient.readContract({
          address: LENS_HUB_CONTRACT_ADDRESS,
          abi: LENS_HUB_ABI,
          functionName: "getProfile",
          args: [profileId],
        })) as LensProfileData;

        const followersCount = (await publicClient.readContract({
          address: LENS_HUB_CONTRACT_ADDRESS,
          abi: LENS_HUB_ABI,
          functionName: "getFollowersCount",
          args: [profileId],
        })) as bigint;

        const followingCount = (await publicClient.readContract({
          address: LENS_HUB_CONTRACT_ADDRESS,
          abi: LENS_HUB_ABI,
          functionName: "getFollowingCount",
          args: [profileId],
        })) as bigint;

        setLensProfile({
          handle: lensData.handle,
          imageURI: lensData.imageURI,
          pubCount: Number(lensData.pubCount),
          profileId: Number(profileId),
          followersCount: Number(followersCount),
          followingCount: Number(followingCount),
        });
      } catch (error: unknown) {
        console.error("Error fetching Lens profile:", error);
        toast.error("Could not fetch Lens profile.", {
          description:
            "The connected wallet may not have a Lens profile, or there was a network issue.",
        });
        setLensProfile(null);
      } finally {
        setLoading(false);
      }
    };

    // Only use legacy if modern SDK didn't work
    if (!modernAccount && !modernLoading) {
      fetchLensProfileLegacy();
    } else {
      setLoading(modernLoading);
    }
  }, [profile?.wallet_address, modernAccount, modernLoading, modernError]);

  return { lensProfile, loading };
};
