import { useAccount, useWriteContract } from 'wagmi';
import { LENS_HUB_ABI, LENS_HUB_CONTRACT_ADDRESS } from '@/lib/lens';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { useLensProfile } from './useLensProfile';

export const useComment = () => {
  const { address, chain } = useAccount();
  const { lensProfile } = useLensProfile();
  const { writeContractAsync, isPending, error } = useWriteContract();

  const comment = useCallback(async (profileIdPointed: bigint, pubIdPointed: bigint, contentURI: string) => {
    if (!lensProfile) {
      toast.error("You must have a Lens profile to comment.");
      return;
    }
    if (!address || !chain) {
      toast.error("Please connect your wallet.");
      return;
    }

    try {
      const vars = {
        profileId: lensProfile.profileId,
        contentURI,
        profileIdPointed,
        pubIdPointed,
        referenceModuleData: [],
        collectModule: '0x0000000000000000000000000000000000000000', // No collect module for comments
        collectModuleInitData: [],
        referenceModule: '0x0000000000000000000000000000000000000000',
        referenceModuleInitData: [],
      };

      const tx = await writeContractAsync({
        address: LENS_HUB_CONTRACT_ADDRESS,
        abi: LENS_HUB_ABI,
        functionName: 'comment',
        args: [vars],
        account: address,
        chain: chain,
      });
      toast.success("Comment transaction sent!", {
        description: `Transaction hash: ${tx}`,
      });
      return tx;
    } catch (err) {
      console.error("Comment transaction failed:", err);
      toast.error("Comment failed", {
        description: (err as Error).message || "An unknown error occurred.",
      });
    }
  }, [writeContractAsync, address, chain, lensProfile]);

  return {
    comment,
    isCommenting: isPending,
    commentError: error,
  };
};