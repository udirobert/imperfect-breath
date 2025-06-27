import { useState, useEffect } from 'react';
import { publicClient } from '@/providers/Web3Provider'; // We need to export this from Web3Provider
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from '@/lib/lens';

export interface LensProfile {
  handle: string;
  imageURI: string;
  pubCount: number;
  profileId: number;
  followersCount: number;
  followingCount: number;
}

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

  useEffect(() => {
    const fetchLensProfile = async () => {
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
          functionName: 'defaultProfile',
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
          functionName: 'getProfile',
          args: [profileId],
        })) as LensProfileData;

        const followersCount = (await publicClient.readContract({
          address: LENS_HUB_CONTRACT_ADDRESS,
          abi: LENS_HUB_ABI,
          functionName: 'getFollowersCount',
          args: [profileId],
        })) as bigint;

        const followingCount = (await publicClient.readContract({
          address: LENS_HUB_CONTRACT_ADDRESS,
          abi: LENS_HUB_ABI,
          functionName: 'getFollowingCount',
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

      } catch (error: any) {
        console.error("Error fetching Lens profile:", error);
        toast.error("Could not fetch Lens profile.", {
          description: "The connected wallet may not have a Lens profile, or there was a network issue."
        });
        setLensProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLensProfile();
  }, [profile?.wallet_address]);

  return { lensProfile, loading };
};