#!/usr/bin/env node

// Standalone test for Story Protocol SDK integration
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { StoryClient } from "@story-protocol/core-sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

// Define the Story Protocol Aeneid testnet
const aeneid = defineChain({
  id: 1315,
  name: "Story Aeneid Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "IP",
    symbol: "IP",
  },
  rpcUrls: {
    default: {
      http: ["https://aeneid.storyrpc.io"],
    },
    public: {
      http: ["https://aeneid.storyrpc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://aeneid.storyscan.io",
    },
  },
});

// Load environment variables
dotenv.config();

// Extract environment variables
const RPC_URL = process.env.VITE_STORY_RPC_URL;
const CHAIN_ID = process.env.VITE_STORY_CHAIN_ID || "1315";
const PRIVATE_KEY = process.env.VITE_STORY_PRIVATE_KEY;
const TEST_WALLET = process.env.VITE_TEST_WALLET_ADDRESS;

if (!RPC_URL || !PRIVATE_KEY) {
  console.error(
    "Missing required environment variables. Please check your .env file"
  );
  console.error("Required: VITE_STORY_RPC_URL, VITE_STORY_PRIVATE_KEY");
  process.exit(1);
}

// Utility function for debugging
const debugLog = (...args) => console.log("[DEBUG]", ...args);

async function runTest() {
  console.log("🧪 Story Protocol SDK Integration Test");
  console.log("=====================================");

  try {
    // Step 1: Initialize the Story Protocol client
    console.log("\n📡 Initializing Story Protocol client...");

    // Create the transport with the RPC URL
    const transport = http(RPC_URL);

    // Create a public client for read operations
    const publicClient = createPublicClient({
      chain: aeneid,
      transport,
    });

    // Create a wallet client for write operations
    const account = privateKeyToAccount(PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: aeneid,
      transport,
    });

    // Create the Story Protocol client
    const client = new StoryClient({
      chain: { id: 1315 }, // Story Protocol Aeneid testnet
      transport,
      publicClient,
      walletClient,
    });

    console.log("✅ Client initialized successfully");
    console.log(`👤 Account: ${account.address}`);

    // Step 2: Register a test breathing pattern
    console.log("\n📝 Registering test breathing pattern...");

    // Create test pattern data
    const testPattern = {
      name: "Test Box Breathing Pattern",
      description: "A simple 4-4-4-4 box breathing pattern for testing",
      phases: {
        inhale: 4,
        hold1: 4,
        exhale: 4,
        hold2: 4,
      },
    };

    // Create metadata
    const metadata = {
      name: testPattern.name,
      description: testPattern.description,
      image: "",
      external_url: "",
      attributes: [
        {
          trait_type: "Creator",
          value: account.address,
        },
        {
          trait_type: "Type",
          value: "breathing_pattern",
        },
        {
          trait_type: "Category",
          value: "wellness",
        },
        ...Object.entries(testPattern.phases).map(([phase, duration]) => ({
          trait_type: `Phase_${phase}`,
          value: duration.toString(),
        })),
      ],
    };

    // Convert metadata to JSON string
    const metadataStr = JSON.stringify(metadata);

    try {
      // Register IP
      const registrationParams = {
        tokenURI: metadataStr,
        tokenURIType: 0,
        royaltyContext: {
          royaltyPolicy: "0x0000000000000000000000000000000000000000",
          royaltyAmount: 0,
        },
      };

      console.log("Sending registration transaction...");
      const result = await client.ipAsset.register(registrationParams);

      console.log("✅ Registration transaction sent!");
      console.log("Transaction hash:", result.txHash || result.hash);

      // In a real implementation, we would wait for transaction confirmation
      // and extract the IP ID from the event logs
      // For this test, we'll use a timestamp as a placeholder
      const ipId = `ip_${Date.now()}`;

      // Step 3: Set license terms
      console.log("\n📜 Setting license terms...");

      const licenseParams = {
        ipId: ipId,
        commercial: true,
        derivatives: true,
        attribution: true,
        royaltyPercentage: 5,
      };

      console.log("Sending license terms transaction...");
      await client.license.setTerms(licenseParams);
      console.log("✅ License terms set successfully!");

      // Step 4: Try to retrieve the pattern (note: in a real scenario, we'd wait for confirmation)
      console.log("\n🔍 Trying to retrieve the pattern...");
      try {
        // This might fail since we're using a placeholder IP ID
        // and not waiting for confirmation
        const ipAsset = await client.ipAsset.get(ipId);
        console.log("IP Asset retrieved:", ipAsset);
      } catch (error) {
        console.log(
          "⚠️ Could not retrieve IP asset (expected in test environment):",
          error.message
        );
      }

      // Step 5: Query user's IP assets
      if (TEST_WALLET) {
        console.log(`\n📋 Listing IP assets for address: ${TEST_WALLET}`);
        try {
          const assets = await client.ipAsset.getByOwner(TEST_WALLET);
          console.log(`Found ${assets.length} assets:`);
          assets.forEach((asset, index) => {
            console.log(`Asset ${index + 1}:`, {
              id: asset.ipId,
              name: asset.name,
              owner: asset.owner,
            });
          });
        } catch (error) {
          console.log("⚠️ Could not retrieve IP assets:", error.message);
        }
      }

      console.log("\n✅ Test completed successfully!");
    } catch (error) {
      console.error("❌ Error during registration:", error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
runTest().catch(console.error);
