import { useState, useEffect, useCallback } from "react";
import * as StoryProtocolSDK from "@story-protocol/core-sdk";
import { StoryClient, PIL_TYPE, RegisterIPParams, RegisterDerivativeParams, SetLicenseTermsParams } from "@story-protocol/core-sdk";
import { config, debugLog, story as storyConfig } from "../config/environment";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

// Define the Story Protocol Aeneid testnet
const aeneid = defineChain({
  id: 1315,
  name: 'Story Aeneid Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://aeneid.storyrpc.io'],
    },
    public: {
      http: ['https://aeneid.storyrpc.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://aeneid.storyscan.io',
    },
  },
});

export interface IPAsset {
  id: string;
  name: string;
  description: string;
  creator: string;
  ipHash: string;
  registrationDate: string;
  licenseTerms?: LicenseTerms;
}

export interface LicenseTerms {
  commercial: boolean;
  derivatives: boolean;
  attribution: boolean;
  royaltyPercentage?: number;
}

export interface DerivativeWork {
  originalId: string;
  derivativeId: string;
  creator: string;
  createdAt: string;
}

// Define the log interface for TypeScript
interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber?: string;
  blockHash?: string;
  transactionHash?: string;
  transactionIndex?: string;
  logIndex?: string;
}

export function useStory() {
  const [client, setClient] = useState<StoryClient | null>(null);
  const [publicClient, setPublicClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userIPAssets, setUserIPAssets] = useState<IPAsset[]>([]);

  // Initialize Story Protocol client
  useEffect(() => {
    const initializeStoryClient = async () => {
      try {
        // Check if we have the necessary configuration
        if (!storyConfig.rpcUrl || !storyConfig.chainId) {
          throw new Error("Missing Story Protocol configuration");
        }

        // Create the transport with the RPC URL
        const transport = http(storyConfig.rpcUrl);
        
        // Create a public client for read operations
        const pubClient = createPublicClient({
          chain: aeneid, // Using Story Protocol Aeneid testnet (chain ID 1315)
          transport,
        });

        // Store the public client for later transaction receipts
        setPublicClient(pubClient);

        // Create a wallet client if we have a private key for write operations
        let walletClient = undefined;
        
        if (storyConfig.privateKey) {
          // Convert private key to account
          const account = privateKeyToAccount(storyConfig.privateKey as `0x${string}`);
          
          // Create wallet client with account
          walletClient = createWalletClient({
            account,
            chain: aeneid,
            transport,
          });
        }
        
        // Initialize Story Protocol client
        let sdkClient: StoryClient | null = null;
        
        try {
          // Create the client using the SDK's exported StoryClient
          if (typeof StoryClient === 'function') {
            sdkClient = new StoryClient({
              chain: { id: 1315 }, // Story Protocol Aeneid testnet
              transport,
              publicClient: pubClient,
              walletClient,
            });
            debugLog("Created StoryClient using constructor");
          } else {
            // Log available exports if we can't create the client
            debugLog("SDK exports available:", Object.keys(StoryProtocolSDK));
            throw new Error("Could not find StoryClient constructor");
          }
        } catch (error) {
          console.error("Failed to create SDK client:", error);
          throw error;
        }
        
        setClient(sdkClient);
        debugLog("Story Protocol client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Story Protocol client:", error);
        setError("Failed to initialize Story Protocol client");
      }
    };
    
    initializeStoryClient();
  }, []);

  const registerBreathingPatternIP = useCallback(
    async (patternData: {
      name: string;
      description: string;
      creator: string;
      patternPhases: Record<string, number>;
      audioUrl?: string;
    }): Promise<IPAsset | null> => {
      if (!client) {
        throw new Error("Story Protocol client not initialized");
      }

      try {
        setIsLoading(true);
        setError(null);

        debugLog("Registering breathing pattern IP:", patternData);

        // Create metadata for the breathing pattern
        const metadata = {
          name: patternData.name,
          description: patternData.description,
          image: "", // No image for breathing patterns
          external_url: "",
          attributes: [
            {
              trait_type: "Creator",
              value: patternData.creator,
            },
            {
              trait_type: "Type",
              value: "breathing_pattern",
            },
            {
              trait_type: "Category",
              value: "wellness",
            },
            ...Object.entries(patternData.patternPhases).map(([phase, duration]) => ({
              trait_type: `Phase_${phase}`,
              value: duration.toString(),
            })),
          ],
        };

        // Convert metadata to JSON string
        const metadataStr = JSON.stringify(metadata);
        
        try {
          // Register IP using the SDK with proper typing
          const registrationParams: RegisterIPParams = {
            tokenURI: metadataStr,
            tokenURIType: 0,
            royaltyContext: {
              royaltyPolicy: "0x0000000000000000000000000000000000000000",
              royaltyAmount: 0,
            }
          };
          
          const result = await client.ipAsset.register(registrationParams);
          
          const hash = result.txHash || result.hash;
          
          if (!hash) {
            throw new Error("No transaction hash returned from registration");
          }
          
          // Wait for transaction receipt and extract IP ID from event logs
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: hash as `0x${string}`
          });
          
          // Extract IP ID from logs
          let ipId = "";
          
          if (receipt.logs && receipt.logs.length > 0) {
            // Find the IP registration event using the actual Story Protocol RegisteredIpAsset event signature
            // Event: RegisteredIpAsset(address indexed owner, uint256 indexed ipAssetId)
            const IP_REGISTERED_EVENT = "0xdc87ba96b5acafca31ee9e9afdfb29be85ea3d56feb9c55a22c9c47f82ec7bf6";
            
            const ipEvent = receipt.logs.find((log: TransactionLog) =>
              log.topics[0] === IP_REGISTERED_EVENT
            );
            
            if (ipEvent) {
              // Parse the IP ID from the event data - it's the second topic (indexed parameter)
              // The second topic contains the ipAssetId as a uint256
              ipId = ipEvent.topics[2];
              debugLog("Extracted IP ID from event:", ipId);
            }
          }
          
          // If we couldn't extract the ID from events, try to fetch the most recent IP asset by owner
          if (!ipId) {
            try {
              // Fetch the owner's address from the transaction receipt
              const txData = await publicClient.getTransaction({ hash: hash as `0x${string}` });
              const owner = txData.from;
              
              // Get the latest IP asset for this owner
              const ownerAssets = await client.ipAsset.getByOwner(owner);
              if (ownerAssets && ownerAssets.length > 0) {
                // Sort by timestamp (most recent first) if available
                const sortedAssets = ownerAssets.sort((a, b) => {
                  const timeA = a.registrationDate ? new Date(a.registrationDate).getTime() : 0;
                  const timeB = b.registrationDate ? new Date(b.registrationDate).getTime() : 0;
                  return timeB - timeA;
                });
                
                // Use the most recent IP asset ID
                ipId = sortedAssets[0].ipId;
                debugLog("Found IP ID by querying owner's assets:", ipId);
              }
            } catch (err) {
              console.warn("Failed to get IP by owner, using fallback method:", err);
            }
            
            // If we still don't have an ID, use the hash as a fallback
            if (!ipId) {
              ipId = `ip_${hash.slice(2, 10)}`;
              console.warn("Could not extract IP ID from events, using fallback ID", ipId);
            }
          }
          
          // Create the IP asset object
          const ipAsset: IPAsset = {
            id: ipId,
            name: patternData.name,
            description: patternData.description,
            creator: patternData.creator,
            ipHash: hash,
            registrationDate: new Date().toISOString(),
          };

          // Update user's IP assets
          setUserIPAssets((prev) => [...prev, ipAsset]);

          debugLog("IP asset registered:", ipAsset);
          return ipAsset;
        } catch (error) {
          console.error("Failed to register IP:", error);
          throw error;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to register IP";
        setError(errorMessage);
        console.error("Story Protocol registration error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client],
  );

  const setLicensingTerms = useCallback(
    async (ipId: string, terms: LicenseTerms): Promise<void> => {
      if (!client) {
        throw new Error("Story Protocol client not initialized");
      }

      try {
        setIsLoading(true);
        setError(null);

        debugLog("Setting licensing terms:", { ipId, terms });

        try {
          // Set license terms using the SDK with proper typing
          const licenseParams: SetLicenseTermsParams = {
            ipId: ipId,
            commercial: terms.commercial,
            derivatives: terms.derivatives,
            attribution: terms.attribution,
            royaltyPercentage: terms.royaltyPercentage || 0,
          };
          
          await client.license.setTerms(licenseParams);
          
          // Update local state
          setUserIPAssets((prev) =>
            prev.map((asset) =>
              asset.id === ipId ? { ...asset, licenseTerms: terms } : asset,
            ),
          );

          debugLog("Licensing terms set successfully");
        } catch (error) {
          console.error("Failed to set license terms:", error);
          throw error;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to set licensing terms";
        setError(errorMessage);
        console.error("Story Protocol licensing error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client],
  );

  const trackDerivativeWork = useCallback(
    async (
      originalId: string,
      derivativeData: {
        name: string;
        description: string;
        creator: string;
      },
    ): Promise<DerivativeWork | null> => {
      if (!client) {
        throw new Error("Story Protocol client not initialized");
      }

      try {
        setIsLoading(true);
        setError(null);

        debugLog("Tracking derivative work:", { originalId, derivativeData });

        // Create metadata for the derivative
        const derivativeMetadata = JSON.stringify({
          name: derivativeData.name,
          description: derivativeData.description,
          creator: derivativeData.creator,
          originalWork: originalId,
          type: "derivative_breathing_pattern",
        });
        
        try {
          // Register derivative using the SDK with proper typing
          const derivativeParams: RegisterDerivativeParams = {
            parentIpId: originalId,
            tokenURI: derivativeMetadata,
            tokenURIType: 0,
            royaltyContext: {
              royaltyPolicy: "0x0000000000000000000000000000000000000000",
              royaltyAmount: 0,
            }
          };
          
          const result = await client.ipAsset.registerDerivative(derivativeParams);
          
          const hash = result.txHash || result.hash;
          
          if (!hash) {
            throw new Error("No transaction hash returned from derivative registration");
          }
          
          // Wait for transaction receipt and extract derivative IP ID from event logs
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: hash as `0x${string}`
          });
          
          // Extract derivative IP ID from logs
          let derivativeId = "";
          
          if (receipt.logs && receipt.logs.length > 0) {
            // Find the derivative registration event using the actual Story Protocol RegisteredDerivativeIp event signature
            // Event: RegisteredDerivativeIp(address indexed owner, uint256 indexed parentIpAssetId, uint256 indexed derivativeIpAssetId)
            const DERIVATIVE_REGISTERED_EVENT = "0x9a7021c376af7064be5cca736d2ebdfbb0c7cdf2049aaf8fb35fc3686f5e33e5";
            
            const derivEvent = receipt.logs.find((log: TransactionLog) =>
              log.topics[0] === DERIVATIVE_REGISTERED_EVENT
            );
            
            if (derivEvent) {
              // Parse the derivative IP ID from the event data - it's the third topic (indexed parameter)
              // The third topic contains the derivativeIpAssetId as a uint256
              derivativeId = derivEvent.topics[3] || derivEvent.topics[2];
              debugLog("Extracted derivative IP ID from event:", derivativeId);
            }
          }
          
          // If we couldn't extract the ID from events, try to fetch the most recent derivative by owner
          if (!derivativeId) {
            try {
              // Fetch the owner's address from the transaction receipt
              const txData = await publicClient.getTransaction({ hash: hash as `0x${string}` });
              const owner = txData.from;
              
              // Story Protocol SDK doesn't have a direct getDerivatives method
              // Instead, query for recent transactions that might be derivatives
              // of the original IP, or go directly to getting the owner's assets
              
              // Skip directly to getting the owner's recent assets
              const ownerAssets = await client.ipAsset.getByOwner(owner);
              
              if (ownerAssets && ownerAssets.length > 0) {
                // Define the interface for IP assets returned by the SDK
                interface StoryIPAsset {
                  ipId: string;
                  name?: string;
                  owner?: string;
                  registrationDate?: number | string;
                  [key: string]: any;
                }
                
                // Sort by timestamp (most recent first) if available
                const sortedAssets = ownerAssets.sort((a: StoryIPAsset, b: StoryIPAsset) => {
                  const timeA = a.registrationDate ? new Date(a.registrationDate).getTime() : 0;
                  const timeB = b.registrationDate ? new Date(b.registrationDate).getTime() : 0;
                  return timeB - timeA;
                });
                
                // Use the most recent IP asset ID - it's likely the derivative we just created
                derivativeId = sortedAssets[0].ipId;
                debugLog("Found derivative ID by querying owner's most recent assets:", derivativeId);
              }
              
              // If still not found, try getting the owner's latest IP assets
              if (!derivativeId) {
                const ownerAssets = await client.ipAsset.getByOwner(owner);
                if (ownerAssets && ownerAssets.length > 0) {
                  // Sort by timestamp (most recent first) if available
                  const sortedAssets = ownerAssets.sort((a, b) => {
                    const timeA = a.registrationDate ? new Date(a.registrationDate).getTime() : 0;
                    const timeB = b.registrationDate ? new Date(b.registrationDate).getTime() : 0;
                    return timeB - timeA;
                  });
                  
                  // Use the most recent IP asset ID
                  derivativeId = sortedAssets[0].ipId;
                  debugLog("Found derivative ID by querying owner's assets:", derivativeId);
                }
              }
            } catch (err) {
              console.warn("Failed to get derivative by owner/original, using fallback method:", err);
            }
            
            // If we still don't have an ID, use the hash as a fallback
            if (!derivativeId) {
              derivativeId = `derivative_${hash.slice(2, 10)}`;
              console.warn("Could not extract derivative IP ID from events, using fallback ID", derivativeId);
            }
          }
          
          // Create the derivative work record
          const derivativeWork: DerivativeWork = {
            originalId,
            derivativeId,
            creator: derivativeData.creator,
            createdAt: new Date().toISOString(),
          };

          debugLog("Derivative work tracked:", derivativeWork);
          return derivativeWork;
        } catch (error) {
          console.error("Failed to register derivative:", error);
          throw error;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to track derivative work";
        setError(errorMessage);
        console.error("Story Protocol derivative tracking error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client],
  );

  const getIPAsset = useCallback(
    async (ipId: string): Promise<IPAsset | null> => {
      if (!client) {
        throw new Error("Story Protocol client not initialized");
      }

      try {
        setError(null);
        debugLog("Fetching IP asset:", ipId);

        try {
          // Fetch IP asset using the SDK
          const ipAsset = await client.ipAsset.get(ipId);
          
          if (ipAsset) {
            // Convert to our IPAsset format
            return {
              id: ipId,
              name: ipAsset.name || "",
              description: ipAsset.description || "",
              creator: ipAsset.owner || "",
              ipHash: ipAsset.ipId || "",
              registrationDate: new Date(ipAsset.registrationDate || Date.now()).toISOString(),
              licenseTerms: await getLicenseTerms(ipId),
            };
          }
        } catch (err) {
          console.warn("Error fetching IP from chain, falling back to local:", err);
        }
        
        // Fallback to local state if not found on chain
        const asset = userIPAssets.find((asset) => asset.id === ipId);
        return asset || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch IP asset";
        setError(errorMessage);
        console.error("Story Protocol fetch error:", err);
        throw err;
      }
    },
    [client, userIPAssets],
  );

  const getUserIPAssets = useCallback(
    async (userAddress: string): Promise<IPAsset[]> => {
      if (!client) {
        throw new Error("Story Protocol client not initialized");
      }

      try {
        setError(null);
        debugLog("Fetching user IP assets:", userAddress);

        try {
          // Define the interface for IP assets returned by the SDK
          interface StoryIPAsset {
            ipId: string;
            name?: string;
            description?: string;
            owner?: string;
            registrationDate?: number | string;
            [key: string]: any;
          }
          
          // Fetch user's IP assets using the SDK
          const chainAssets = await client.ipAsset.getByOwner(userAddress);
          
          if (chainAssets && chainAssets.length > 0) {
            // Convert to our IPAsset format
            const formattedAssets = await Promise.all(
              chainAssets.map(async (asset: StoryIPAsset) => ({
                id: asset.ipId,
                name: asset.name || "Unnamed Pattern",
                description: asset.description || "",
                creator: asset.owner || userAddress,
                ipHash: asset.ipId,
                registrationDate: new Date(asset.registrationDate || Date.now()).toISOString(),
                licenseTerms: await getLicenseTerms(asset.ipId),
              }))
            );
            
            // Update local state
            setUserIPAssets(formattedAssets);
            return formattedAssets;
          }
        } catch (err) {
          console.warn("Error fetching user IP assets from chain, falling back to local:", err);
        }
        
        // Fallback to local state
        return userIPAssets.filter((asset) => asset.creator === userAddress);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user IP assets";
        setError(errorMessage);
        console.error("Story Protocol user assets error:", err);
        throw err;
      }
    },
    [client, userIPAssets],
  );

  const calculateRoyalties = useCallback(
    async (
      ipId: string,
      revenue: number,
    ): Promise<{ creator: number; platform: number }> => {
      try {
        setError(null);

        const asset = await getIPAsset(ipId);
        if (!asset || !asset.licenseTerms) {
          throw new Error("IP asset or license terms not found");
        }

        const royaltyPercentage = asset.licenseTerms.royaltyPercentage || 10;
        const creatorRoyalty = (revenue * royaltyPercentage) / 100;
        const platformFee = revenue - creatorRoyalty;

        debugLog("Royalties calculated:", {
          ipId,
          revenue,
          creatorRoyalty,
          platformFee,
        });

        return {
          creator: creatorRoyalty,
          platform: platformFee,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to calculate royalties";
        setError(errorMessage);
        console.error("Story Protocol royalty calculation error:", err);
        throw err;
      }
    },
    [getIPAsset],
  );
  
  // Helper function to get license terms for an IP asset
  const getLicenseTerms = async (ipId: string): Promise<LicenseTerms | undefined> => {
    try {
      if (!client) return undefined;
      
      // Get license terms from chain
      const terms = await client.license.getTerms(ipId);
      
      if (terms) {
        return {
          commercial: terms.commercial || false,
          derivatives: terms.derivatives || false,
          attribution: terms.attribution || false,
          royaltyPercentage: terms.royaltyPercentage || 0,
        };
      }
      
      return undefined;
    } catch (err) {
      console.warn("Error fetching license terms:", err);
      return undefined;
    }
  };

  return {
    client,
    isLoading,
    error,
    userIPAssets,
    registerBreathingPatternIP,
    setLicensingTerms,
    trackDerivativeWork,
    getIPAsset,
    getUserIPAssets,
    calculateRoyalties,
  };
}
