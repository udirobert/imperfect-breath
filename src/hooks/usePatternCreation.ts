/**
 * Unified Pattern Creation Hook
 * Handles pattern creation across multiple blockchains (Flow, Lens, etc.)
 * without code duplication
 */

import { useState, useCallback } from "react";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { useFlow } from "./useFlow";

import { useLens } from "./useLens";
import { useToast } from "./use-toast";
import type { CustomPattern } from "../lib/ai/providers";
import type { BlockchainType } from "../components/blockchain/BlockchainSelector";
import type {
  BreathingPatternAttributes,
  NFTMetadata,
} from "../lib/flow/types";

export interface PatternCreationOptions {
  blockchain: BlockchainType;
  mintAsNFT?: boolean;
  enableRoyalties?: boolean;
  royaltyPercentage?: number;
  shareOnSocial?: boolean;
  price?: number;
}

export interface PatternCreationResult {
  success: boolean;
  patternId?: string;
  transactionHash?: string;
  socialPostId?: string;
  error?: string;
}

interface UsePatternCreationState {
  isCreating: boolean;
  isUploading: boolean;
  isMinting: boolean;
  isSharing: boolean;
  progress: number;
  currentStep: string;
}

export const usePatternCreation = () => {
  const { toast } = useToast();
  const unifiedAuth = useUnifiedAuth();
  const { mintBreathingPattern: mintFlowNFT, isMinting: isFlowMinting } =
    useFlow();

  const { shareBreathingPattern, isPosting: isLensCreating } = useLens();

  const [state, setState] = useState<UsePatternCreationState>({
    isCreating: false,
    isUploading: false,
    isMinting: false,
    isSharing: false,
    progress: 0,
    currentStep: "",
  });

  const updateProgress = useCallback((step: string, progress: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
      progress,
    }));
  }, []);

  const validateCreationOptions = useCallback(
    (
      pattern: CustomPattern,
      options: PatternCreationOptions,
    ): { valid: boolean; error?: string } => {
      // Basic pattern validation
      if (!pattern.name || pattern.name.trim().length === 0) {
        return { valid: false, error: "Pattern name is required" };
      }

      if (!pattern.phases || Object.keys(pattern.phases).length === 0) {
        return { valid: false, error: "Pattern must have breathing phases" };
      }

      // Blockchain-specific validation
      switch (options.blockchain) {
        case "flow":
          if (!unifiedAuth.flow.connected) {
            return { valid: false, error: "Flow wallet not connected" };
          }
          if (options.mintAsNFT && !unifiedAuth.flow.canMintNFTs) {
            return { valid: false, error: "Cannot mint NFTs on Flow" };
          }
          break;

        case "lens":
          if (!unifiedAuth.lens.connected) {
            return { valid: false, error: "Lens profile not connected" };
          }
          if (options.shareOnSocial && !unifiedAuth.lens.canPost) {
            return { valid: false, error: "Cannot post to Lens" };
          }
          break;

        case "ethereum":
        case "arbitrum":
        case "base":
          if (!unifiedAuth.walletConnected) {
            return { valid: false, error: "EVM wallet not connected" };
          }
          break;

        default:
          return { valid: false, error: "Unsupported blockchain" };
      }

      // Royalty validation
      if (options.enableRoyalties) {
        if (
          !options.royaltyPercentage ||
          options.royaltyPercentage < 0 ||
          options.royaltyPercentage > 50
        ) {
          return {
            valid: false,
            error: "Royalty percentage must be between 0 and 50%",
          };
        }
      }

      return { valid: true };
    },
    [unifiedAuth],
  );

  const createFlowNFT = useCallback(
    async (
      pattern: CustomPattern,
      options: PatternCreationOptions,
    ): Promise<{
      success: boolean;
      transactionHash?: string;
      error?: string;
    }> => {
      try {
        updateProgress("Preparing Flow NFT metadata...", 20);

        const inhalePhase = pattern.phases.find((p) => p.name === "inhale");
        const holdPhase = pattern.phases.find((p) => p.name === "hold");
        const exhalePhase = pattern.phases.find((p) => p.name === "exhale");
        const restPhase = pattern.phases.find((p) => p.name === "rest");

        const attributes: BreathingPatternAttributes = {
          inhale: inhalePhase?.duration || 4,
          hold: holdPhase?.duration || 4,
          exhale: exhalePhase?.duration || 4,
          rest: restPhase?.duration || 4,
          difficulty: pattern.difficulty || "beginner",
          category: pattern.category || "general",
          tags: pattern.tags || [],
          totalCycles: 10,
          estimatedDuration: pattern.duration || 300,
        };

        const metadata: NFTMetadata = {
          name: pattern.name,
          description: pattern.description || "",
          image: "", // TODO: Add image support
          attributes: Object.entries(attributes).map(([key, value]) => ({
            trait_type: key,
            value: typeof value === "object" ? JSON.stringify(value) : value,
          })),
        };

        const royalties = options.enableRoyalties
          ? [
              {
                receiver: unifiedAuth.walletAddress!,
                cut: options.royaltyPercentage!,
                description: `Royalty for ${pattern.name}`,
              },
            ]
          : [];

        updateProgress("Minting NFT on Flow...", 60);

        const transactionHash = await mintFlowNFT(
          attributes,
          metadata,
          unifiedAuth.flow.address!,
          royalties,
        );

        updateProgress("Flow NFT minted successfully", 100);

        return { success: true, transactionHash };
      } catch (error) {
        console.error("Flow NFT creation failed:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to mint Flow NFT",
        };
      }
    },
    [unifiedAuth, mintFlowNFT, updateProgress],
  );

  const createLensContent = useCallback(
    async (
      pattern: CustomPattern,
      options: PatternCreationOptions,
    ): Promise<{ success: boolean; postId?: string; error?: string }> => {
      try {
        updateProgress("Creating Lens post...", 40);

        const content = `🌬️ New breathing pattern: ${pattern.name}\n\n${pattern.description}\n\nDifficulty: ${pattern.difficulty}\nDuration: ${Math.round((pattern.duration || 0) / 60)} minutes\n\n#BreathingPattern #Wellness #ImperfectBreath`;

        const breathingPattern = {
          id: `pattern_${Date.now()}`,
          name: pattern.name,
          description: pattern.description,
          duration: pattern.duration,
          phases: pattern.phases.map((phase) => ({
            name: phase.name,
            duration: phase.duration,
            instructions: `${phase.name} for ${phase.duration} seconds`,
          })),
          difficulty: pattern.difficulty,
          category: pattern.category,
        };

        updateProgress("Publishing to Lens...", 70);

        const result = await shareBreathingPattern(breathingPattern);
        if (!result.success) {
          throw new Error(result.error);
        }
        const postId = result.postId;

        updateProgress("Lens post created successfully", 100);

        return { success: true, postId };
      } catch (error) {
        console.error("Lens post creation failed:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to create Lens post",
        };
      }
    },
    [shareBreathingPattern, updateProgress],
  );

  const createPattern = useCallback(
    async (
      pattern: CustomPattern,
      options: PatternCreationOptions,
    ): Promise<PatternCreationResult> => {
      // Validate inputs
      const validation = validateCreationOptions(pattern, options);
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.error,
          variant: "destructive",
        });
        return { success: false, error: validation.error };
      }

      setState((prev) => ({ ...prev, isCreating: true }));
      updateProgress("Starting pattern creation...", 0);

      try {
        const result: PatternCreationResult = { success: true };

        // Step 1: Handle blockchain-specific creation
        switch (options.blockchain) {
          case "flow":
            if (options.mintAsNFT) {
              setState((prev) => ({ ...prev, isMinting: true }));
              const flowResult = await createFlowNFT(pattern, options);
              setState((prev) => ({ ...prev, isMinting: false }));

              if (!flowResult.success) {
                throw new Error(flowResult.error);
              }
              result.transactionHash = flowResult.transactionHash;
            }
            break;

          case "lens":
            if (options.shareOnSocial) {
              setState((prev) => ({ ...prev, isSharing: true }));
              const lensResult = await createLensContent(pattern, options);
              setState((prev) => ({ ...prev, isSharing: false }));

              if (!lensResult.success) {
                throw new Error(lensResult.error);
              }
              result.socialPostId = lensResult.postId;
            }
            break;

          case "ethereum":
          case "arbitrum":
          case "base":
            // Handle EVM-specific creation if needed
            updateProgress("Processing on EVM chain...", 50);
            break;
        }

        // Step 2: IP registration disabled (Story Protocol removed)

        // Step 3: Save to local storage/database
        updateProgress("Saving pattern...", 90);

        // Save pattern data locally or to your backend
        const patternData = {
          ...pattern,
          blockchain: options.blockchain,
          transactionHash: result.transactionHash,
          socialPostId: result.socialPostId,
          createdAt: new Date().toISOString(),
          createdBy: unifiedAuth.user?.id,
        };

        // TODO: Save to your pattern storage service
        // await patternStorageService.savePattern(patternData);

        result.patternId = `pattern_${Date.now()}`;

        updateProgress("Pattern created successfully!", 100);

        toast({
          title: "Pattern Created Successfully!",
          description: `Your breathing pattern "${pattern.name}" has been created on ${options.blockchain}.`,
        });

        return result;
      } catch (error) {
        console.error("Pattern creation failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        toast({
          title: "Creation Failed",
          description: errorMessage,
          variant: "destructive",
        });

        return { success: false, error: errorMessage };
      } finally {
        setState((prev) => ({
          ...prev,
          isCreating: false,
          isMinting: false,
          isSharing: false,
          progress: 0,
          currentStep: "",
        }));
      }
    },
    [
      validateCreationOptions,
      createFlowNFT,
      createLensContent,
      unifiedAuth,
      toast,
      updateProgress,
    ],
  );

  const getAvailableBlockchains = useCallback((): BlockchainType[] => {
    const available: BlockchainType[] = [];

    if (unifiedAuth.lens.connected) {
      available.push("lens");
    }
    if (unifiedAuth.flow.connected) {
      available.push("flow");
    }
    if (unifiedAuth.walletConnected) {
      available.push("ethereum", "arbitrum", "base");
    }

    return available;
  }, [unifiedAuth]);

  const getRecommendedBlockchain = useCallback(
    (
      pattern: CustomPattern,
      options: PatternCreationOptions,
    ): BlockchainType => {
      // Recommend based on use case
      if (options.mintAsNFT && unifiedAuth.flow.connected) {
        return "flow"; // Flow is optimized for NFTs
      }
      if (options.shareOnSocial && unifiedAuth.lens.connected) {
        return "lens"; // Lens is for social content
      }
      if (unifiedAuth.walletConnected) {
        return "arbitrum"; // Good default for EVM with lower fees
      }

      return "lens"; // Default fallback
    },
    [unifiedAuth],
  );

  return {
    // State
    ...state,
    isProcessing: state.isCreating || isFlowMinting || isLensCreating,

    // Actions
    createPattern,

    // Utilities
    getAvailableBlockchains,
    getRecommendedBlockchain,
    validateCreationOptions,
  };
};

export default usePatternCreation;
