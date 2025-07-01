// TODO: Replace with proper multichain implementation
// import { useAccount, useWriteContract } from 'wagmi';
import { useState } from 'react';
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from '@/lib/lens';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { useLensProfile } from './useLensProfile';

export const useMirror = () => {
  const { address, chain } = useAccount();
  const { lensProfile } = useLensProfile();
  const { writeContractAsync, isPending, error } = useWriteContract();

  const mirror = useCallback(async (profileIdPointed: bigint, pubIdPointed: bigint) => {
    if (!lensProfile) {
      toast.error("You must have a Lens profile to mirror.");
      return;
    }
    if (!address || !chain) {
      toast.error("Please connect your wallet.");
      return;
    }

    try {
      const vars = {
        profileId: lensProfile.profileId,
        profileIdPointed,
        pubIdPointed,
        referenceModuleData: [],
        referenceModule: '0x0000000000000000000000000000000000000000',
        referenceModuleInit: [],
      };

      const tx = await writeContractAsync({
        address: LENS_HUB_CONTRACT_ADDRESS,
        abi: LENS_HUB_ABI,
        functionName: 'mirror',
        args: [vars],
        account: address,
        chain: chain,
      });
      toast.success("Mirror transaction sent!", {
        description: `Transaction hash: ${tx}`,
      });
      return tx;
    } catch (err) {
      console.error("Mirror transaction failed:", err);
      toast.error("Mirror failed", {
        description: (err as Error).message || "An unknown error occurred.",
      });
    }
  }, [writeContractAsync, address, chain, lensProfile]);

  return {
    mirror,
    isMirroring: isPending,
    mirrorError: error,
  };
};