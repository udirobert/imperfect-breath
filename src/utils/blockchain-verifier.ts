/**
 * Blockchain Verifier Utility
 * 
 * This utility helps verify connections and functionality across 
 * all three blockchain networks used in the application:
 * - Flow Testnet
 * - Story Aeneid Testnet
 * - Lens Chain Testnet
 */

import { useFlow } from '../hooks/useFlow';
import { useStory } from '../hooks/useStory';
import { useLens } from '../hooks/useLens';
import { NetworkConfig, BLOCKCHAIN_NETWORKS } from '../types/network';

interface VerificationResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: number;
}

interface NetworkVerificationResults {
  flow: VerificationResult | null;
  story: VerificationResult | null;
  lens: VerificationResult | null;
  allSuccessful: boolean;
}

/**
 * Verifies connection to Flow Testnet
 */
export const verifyFlowConnection = async (): Promise<VerificationResult> => {
  try {
    const flow = useFlow({ network: 'testnet' });
    await flow.initialize();
    await flow.connect();
    
    // Verify we can execute a simple script
    const scriptResult = await flow.executeTransaction(`
      pub fun main(): String {
        return "Flow connection successful"
      }
    `);
    
    return {
      success: true,
      message: "Successfully connected to Flow Testnet",
      details: {
        user: flow.user,
        transactionId: scriptResult.transactionId
      },
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Flow Testnet: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now()
    };
  }
};

/**
 * Verifies connection to Story Aeneid Testnet
 */
export const verifyStoryConnection = async (): Promise<VerificationResult> => {
  try {
    const story = useStory();
    await story.initialize();
    
    // Get account info to verify connection
    // Using available methods from useStory instead of non-existent getIPRegistrations
    const ipAsset = await story.getIPAsset("sample-ip-id");
    
    return {
      success: true,
      message: "Successfully connected to Story Aeneid Testnet",
      details: {
        ipAssetFound: ipAsset !== null,
        ipAssetInfo: ipAsset
      },
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Story Aeneid Testnet: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now()
    };
  }
};

/**
 * Verifies connection to Lens Chain Testnet
 */
export const verifyLensConnection = async (): Promise<VerificationResult> => {
  try {
    const lens = useLens();
    // Using authenticate instead of non-existent connect method
    await lens.authenticate();
    
    // Verify connection by fetching recommended profiles
    // Using available methods from useLens instead of non-existent getRecommendedProfiles
    const profiles = await lens.getFollowers(lens.currentAccount?.address || "");
    
    return {
      success: true,
      message: "Successfully connected to Lens Chain Testnet",
      details: {
        profileCount: profiles.length,
        sampleProfile: profiles[0]
      },
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Lens Chain Testnet: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now()
    };
  }
};

/**
 * Verifies API endpoints configuration
 */
export const verifyApiEndpoints = async (): Promise<VerificationResult> => {
  try {
    // Use network configuration from our central config
    const lensApiTest = await fetch(BLOCKCHAIN_NETWORKS.lens.apiUrl);
    const storyApiTest = await fetch(BLOCKCHAIN_NETWORKS.story.apiUrl);
    const flowApiTest = await fetch(`${BLOCKCHAIN_NETWORKS.flow.apiUrl}/blocks?height=sealed`);
    
    if (!lensApiTest.ok || !storyApiTest.ok || !flowApiTest.ok) {
      throw new Error('One or more API endpoints are not responding correctly');
    }
    
    return {
      success: true,
      message: "All API endpoints are properly configured and responding",
      details: {
        lensApiStatus: lensApiTest.status,
        storyApiStatus: storyApiTest.status,
        flowApiStatus: flowApiTest.status
      },
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      message: `API endpoint verification failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now()
    };
  }
};

/**
 * Verify wallet integration (ConnectKit/Avara)
 */
export const verifyWalletIntegration = async (): Promise<VerificationResult> => {
  try {
    // Test ConnectKit integration
    const connectKitAvailable = typeof window !== 'undefined' && 
      window.hasOwnProperty('connectkit');
    
    if (!connectKitAvailable) {
      throw new Error('ConnectKit is not available in the window object');
    }
    
    // Additional wallet checks could be added here
    
    return {
      success: true,
      message: "Wallet integration is properly configured",
      details: {
        connectKitAvailable
      },
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      message: `Wallet integration verification failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now()
    };
  }
};

/**
 * Run comprehensive verification across all networks
 */
export const verifyAllNetworks = async (): Promise<NetworkVerificationResults> => {
  const flowResult = await verifyFlowConnection();
  const storyResult = await verifyStoryConnection();
  const lensResult = await verifyLensConnection();
  
  return {
    flow: flowResult,
    story: storyResult,
    lens: lensResult,
    allSuccessful: flowResult.success && storyResult.success && lensResult.success
  };
};

/**
 * Test-specific utility to validate all blockchain connections
 * in development and testing environments
 */
export const runBlockchainVerificationTests = async () => {
  console.log('🧪 Starting blockchain verification tests...');
  
  const networkResults = await verifyAllNetworks();
  const apiResults = await verifyApiEndpoints();
  const walletResults = await verifyWalletIntegration();
  
  console.log('Flow Testnet:', networkResults.flow?.success ? '✅' : '❌', networkResults.flow?.message);
  console.log('Story Testnet:', networkResults.story?.success ? '✅' : '❌', networkResults.story?.message);
  console.log('Lens Chain:', networkResults.lens?.success ? '✅' : '❌', networkResults.lens?.message);
  console.log('API Endpoints:', apiResults.success ? '✅' : '❌', apiResults.message);
  console.log('Wallet Integration:', walletResults.success ? '✅' : '❌', walletResults.message);
  
  if (networkResults.allSuccessful && apiResults.success && walletResults.success) {
    console.log('🎉 All blockchain connections verified successfully!');
    return true;
  } else {
    console.error('❌ Some blockchain connections failed verification. Check details above.');
    return false;
  }
};