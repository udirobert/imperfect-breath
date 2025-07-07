require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { StoryClient, StoryConfig } = require("@story-protocol/core-sdk");
const { createPublicClient, http, createWalletClient } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { aeneid } = require("viem/chains");
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

// Import routes
const storyProtocolRoutes = require("./api/story-protocol-routes");
const socialRoutes = require("./api/social-routes");
const patternRoutes = require("./api/pattern-routes");

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Key Authentication middleware
const authenticateApiKey = (req, res, next) => {
  // Skip API key check for certain endpoints
  const publicEndpoints = [
    "/api/health",
    "/api/patterns/trending",
    "/api/community/stats",
  ];

  if (publicEndpoints.some((endpoint) => req.path.startsWith(endpoint))) {
    return next();
  }

  const apiKey = req.headers["x-api-key"];
  const configuredApiKey = process.env.API_KEY;

  // If API_KEY is not set in environment, skip authentication
  if (!configuredApiKey) {
    console.warn(
      "WARNING: API_KEY not set in environment. Authentication disabled."
    );
    return next();
  }

  // Check if API key is valid
  if (!apiKey || apiKey !== configuredApiKey) {
    return res.status(401).json({
      error: "Unauthorized: Invalid or missing API key",
      code: "AUTH_FAILED",
    });
  }

  next();
};

// Apply authentication middleware to all API routes
app.use("/api", authenticateApiKey);

// Register Story Protocol backend proxy routes
app.use("/backend-proxy", authenticateApiKey, storyProtocolRoutes);

// Register social and pattern routes
app.use("/api/social", socialRoutes);
app.use("/api/patterns", patternRoutes);

// Add route aliases to match frontend expectations
app.use("/api/marketplace", patternRoutes); // Map marketplace/* to patterns/*
app.use("/api/creator", socialRoutes); // Map creator/* to social/*

// Add community stats endpoint
app.get("/api/community/stats", (req, res) => {
  res.json({
    userCount: 1200,
    sessionCount: 5400,
    patternCount: 350,
    lastUpdated: new Date().toISOString(),
  });
});

// Helper function to generate a content hash
const generateContentHash = (content) => {
  return "0x" + crypto.createHash("sha256").update(content).digest("hex");
};

// Network configuration
const STORY_NETWORKS = {
  testnet: {
    chainId: 1315, // Story Aeneid Testnet
    name: "Story Aeneid Testnet",
    rpcUrl: process.env.RPC_URL || "https://aeneid.storyrpc.io",
    explorer: "https://aeneid.storyscan.io",
  },
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
    explorer: "https://etherscan.io",
  },
};

// Define Aeneid testnet chain for viem if not imported from viem/chains
const aeneidChain = {
  id: 1315,
  name: "Story Aeneid Testnet",
  network: "aeneid",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    public: { http: ["https://aeneid.storyrpc.io"] },
    default: { http: ["https://aeneid.storyrpc.io"] },
  },
  blockExplorers: {
    default: { name: "Story Scan", url: "https://aeneid.storyscan.io" },
  },
};

// Initialize Story Protocol SDK using viem
const initializeStoryClient = () => {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Missing required environment variable: PRIVATE_KEY");
    }

    // Remove '0x' prefix if present for consistent formatting
    const formattedPrivateKey = privateKey.startsWith("0x")
      ? privateKey
      : `0x${privateKey}`;

    const rpcUrl = process.env.RPC_URL || "https://aeneid.storyrpc.io";
    console.log(`Connecting to RPC URL: ${rpcUrl}`);

    // Create the HTTP transport function that viem expects
    const transport = http(rpcUrl);

    // Create account from private key
    const account = privateKeyToAccount(formattedPrivateKey);

    // Create a new Story client with proper viem setup
    return StoryClient.newClient({
      account,
      transport,
      chain: aeneidChain,
    });
  } catch (error) {
    console.error("Error initializing Story Protocol client:", error);
    return null;
  }
};

// Get Story Client instance (lazy initialization)
let storyClient = null;
const getStoryClient = () => {
  if (!storyClient) {
    storyClient = initializeStoryClient();
  }
  return storyClient;
};

// Export getStoryClient for use in route handlers
module.exports.getStoryClient = getStoryClient;

// Make storyClient available globally for route handlers
global.storyClient = storyClient;

// Middleware to set network based on request header
const getNetworkFromRequest = (req) => {
  const networkName = req.headers["x-network"] || "testnet";
  return networkName === "mainnet" ? "mainnet" : "testnet";
};

// API Routes

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Get IP Asset by ID
app.get("/api/ip-assets/:id", async (req, res) => {
  try {
    const client = getStoryClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: "Story Protocol client not initialized" });
    }

    const id = req.params.id;
    const ipAsset = await client.ipAsset.get({ tokenId: id });

    res.status(200).json(ipAsset);
  } catch (error) {
    console.error("Error fetching IP asset:", error);
    res.status(500).json({ error: error.message });
  }
});

// Register IP Asset
app.post("/api/ip-assets/register", async (req, res) => {
  try {
    const client = getStoryClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: "Story Protocol client not initialized" });
    }

    const { pattern, licenseType, commercialTerms } = req.body;

    if (!pattern || !pattern.name) {
      return res
        .status(400)
        .json({ error: "Missing required fields: pattern data" });
    }

    // Generate content hash from the pattern data
    const contentHash = generateContentHash(JSON.stringify(pattern));

    // In a real implementation, we would upload metadata to IPFS or another storage
    // For now, we'll use a placeholder URL that references the Story IP Explorer
    const metadataURI = `https://aeneid.explorer.story.foundation/metadata/${Date.now()}`;

    // Use the SDK's register method
    const registerParams = {
      name: pattern.name,
      contentHash,
      metadataURI,
      externalURI: pattern.imageUri || "",
      royaltyContext: {
        royaltyPolicy: "0x0000000000000000000000000000000000000000",
        royaltyAmount: 0,
      },
    };

    const txResponse = await client.ipAsset.register(registerParams);
    const receipt = await txResponse.wait();

    // Extract IP Asset ID from event logs
    let ipId = null;
    if (receipt.logs && receipt.logs.length > 0) {
      // Find the IP registered event in logs
      // This is a simplified approach and may need adjustment
      const registerEvent = receipt.logs.find((log) => {
        return log.topics && log.topics.length > 0;
      });

      if (registerEvent) {
        ipId = registerEvent.topics[1]; // The IP ID is typically in the first topic
      }
    }

    // If we have an IP ID, register license terms
    if (ipId) {
      try {
        // Set license terms based on the license type
        const licenseParams = {
          ipId,
          commercial:
            licenseType === "commercialUse" ||
            licenseType === "commercialRemix",
          derivatives: true,
          attribution: true,
          royaltyPercentage: commercialTerms?.revShare || 0,
        };

        const licenseResult = await client.license.setTerms(licenseParams);
        await licenseResult.wait();
      } catch (licenseError) {
        console.warn("Failed to set license terms:", licenseError);
      }
    }

    res.status(201).json({
      success: true,
      ipId: ipId || `0x${txResponse.hash.slice(2, 10)}`,
      tokenId: "0", // SDK doesn't return tokenId directly
      txHash: txResponse.hash,
      licenseTermsId: "0", // We don't get this directly from the SDK
      explorerUrl: `${STORY_NETWORKS[getNetworkFromRequest(req)].explorer}/tx/${
        txResponse.hash
      }`,
    });
  } catch (error) {
    console.error("Error registering IP asset:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all IP Assets for an address
app.get("/api/ip-assets/by-owner/:address", async (req, res) => {
  try {
    const client = getStoryClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: "Story Protocol client not initialized" });
    }

    const address = req.params.address;
    const ipAssets = await client.ipAsset.getByOwner({ owner: address });

    res.status(200).json(ipAssets);
  } catch (error) {
    console.error("Error fetching IP assets by owner:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create License Terms
app.post("/api/license", async (req, res) => {
  try {
    const client = getStoryClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: "Story Protocol client not initialized" });
    }

    const { licenseType, commercialTerms } = req.body;

    // The SDK doesn't have a standalone license terms creation method
    // Licenses are created in relation to specific IP assets

    res.status(400).json({
      success: false,
      error:
        "Standalone license creation not supported by SDK. Use setIPLicenseTerms instead.",
    });
  } catch (error) {
    console.error("Error creating license terms:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Set license terms for an IP
app.put("/api/license/:ipId", async (req, res) => {
  try {
    const client = getStoryClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: "Story Protocol client not initialized" });
    }

    const ipId = req.params.ipId;
    const { terms } = req.body;

    if (!terms) {
      return res.status(400).json({ error: "Missing required fields: terms" });
    }

    const result = await client.license.setTerms({
      ipId,
      commercial: terms.commercialUse,
      derivatives: terms.derivativeWorks,
      attribution: terms.attributionRequired,
      royaltyPercentage: terms.royaltyPercent,
    });

    const receipt = await result.wait();

    res.status(200).json({
      success: true,
      txHash: result.hash,
      licenseTermsId: "0", // SDK doesn't return licenseTermsId directly
    });
  } catch (error) {
    console.error("Error setting license terms:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Register derivative
app.post("/api/derivative", async (req, res) => {
  try {
    const client = getStoryClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: "Story Protocol client not initialized" });
    }

    const { originalIpId, licenseTermsId, derivativePattern } = req.body;

    if (!originalIpId || !licenseTermsId || !derivativePattern) {
      return res.status(400).json({
        error:
          "Missing required fields: originalIpId, licenseTermsId, derivativePattern",
      });
    }

    // First register the derivative as a new IP
    // Generate content hash from the pattern data
    const contentHash = generateContentHash(JSON.stringify(derivativePattern));

    // In a real implementation, we would upload metadata to IPFS or another storage
    // For now, we'll use a placeholder URL that references the Story IP Explorer
    const metadataURI = `https://aeneid.explorer.story.foundation/metadata/${Date.now()}`;

    // Use the SDK's register method
    const registerParams = {
      name: derivativePattern.name,
      contentHash,
      metadataURI,
      externalURI: derivativePattern.imageUri || "",
      royaltyContext: {
        royaltyPolicy: "0x0000000000000000000000000000000000000000",
        royaltyAmount: 0,
      },
    };

    const result = await client.ipAsset.register(registerParams);
    const receipt = await result.wait();

    // Extract IP ID from logs
    let ipId = null;
    if (receipt.logs && receipt.logs.length > 0) {
      // Find the IP registered event in logs
      const registerEvent = receipt.logs.find((log) => {
        return log.topics && log.topics.length > 0;
      });

      if (registerEvent) {
        ipId = registerEvent.topics[1]; // The IP ID is typically in the first topic
      }
    }

    // Note: The Story Protocol SDK may not have direct methods for creating
    // derivative relationships in the current version
    console.log(
      `Registered derivative IP: ${ipId} from parent: ${originalIpId}`
    );

    res.status(201).json({
      success: true,
      ipId: ipId || `0x${result.hash.slice(2, 10)}`,
      tokenId: "0", // SDK doesn't return tokenId directly
      txHash: result.hash,
      parentIpIds: [originalIpId],
      licenseTermsIds: [licenseTermsId],
    });
  } catch (error) {
    console.error("Error registering derivative:", error);
    res.status(500).json({
      success: false,
      parentIpIds: [req.body.originalIpId],
      licenseTermsIds: [req.body.licenseTermsId],
      error: error.message,
    });
  }
});

// Transfer IP Asset
app.post("/api/ip-assets/:id/transfer", async (req, res) => {
  try {
    const client = getStoryClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: "Story Protocol client not initialized" });
    }

    const ipId = req.params.id;
    const { toAddress } = req.body;

    if (!toAddress) {
      return res
        .status(400)
        .json({ error: "Missing required field: toAddress" });
    }

    // Get the IP asset details
    const ipAsset = await client.ipAsset.get({ tokenId: ipId });

    if (!ipAsset) {
      return res.status(404).json({
        success: false,
        message: "IP asset not found",
        transferInstructions: "",
        error: "Could not find IP asset with the provided ID",
      });
    }

    // Extract the NFT contract address and token ID
    const nftContract = ipAsset.tokenContract || ipAsset.address || "";
    const tokenId = ipAsset.tokenId || ipAsset.id || "0";

    // Provide instructions for transferring the NFT
    // Note: In a real implementation, we would perform the transfer
    // For this example, we'll just return instructions
    const instructions = `
To transfer this IP asset, you need to interact directly with the NFT contract:

1. NFT Contract Address: ${nftContract}
2. Token ID: ${tokenId}
3. Recipient Address: ${toAddress}
4. Network: Story Aeneid Testnet (Chain ID: 1315)

Example code using ethers.js:
\`\`\`typescript
import { ethers } from "ethers";

// Set up provider and signer
// Make sure you're connected to Story Aeneid Testnet (Chain ID: 1315)
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// NFT contract details
const nftContractAddress = "${nftContract}";
const tokenId = "${tokenId}";
const toAddress = "${toAddress}";

// ERC-721 transfer function in the ABI
const abi = [
  "function safeTransferFrom(address from, address to, uint256 tokenId) external"
];

// Create contract instance
const nftContract = new ethers.Contract(nftContractAddress, abi, signer);

// Transfer the NFT
const tx = await nftContract.safeTransferFrom(
  await signer.getAddress(),
  toAddress,
  tokenId
);

// Wait for confirmation
await tx.wait();

// You can view the transaction on the Story Aeneid Explorer:
// https://aeneid.storyscan.io/tx/{TX_HASH}
\`\`\`
`;

    res.status(200).json({
      success: true,
      message:
        "IP assets must be transferred at the NFT contract level, not via the SDK",
      transferInstructions: instructions,
    });
  } catch (error) {
    console.error("Error preparing transfer instructions:", error);
    res.status(500).json({
      success: false,
      message: "Error preparing transfer instructions",
      transferInstructions: "",
      error: error.message,
    });
  }
});

// Claim revenue from derivatives
app.post("/api/ip-assets/:id/claim-revenue", async (req, res) => {
  try {
    const client = getStoryClient();
    if (!client) {
      return res
        .status(500)
        .json({ error: "Story Protocol client not initialized" });
    }

    const ipId = req.params.id;
    const { childIpIds } = req.body;

    if (!childIpIds || !Array.isArray(childIpIds)) {
      return res
        .status(400)
        .json({ error: "Missing required field: childIpIds (array)" });
    }

    // The SDK may not have direct revenue claiming methods in the current version
    res.status(400).json({
      success: false,
      error: "Revenue claiming not supported by the current SDK version",
    });
  } catch (error) {
    console.error("Error claiming revenue:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// File upload endpoint for metadata/images
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate URL for the uploaded file
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      fileUrl,
      fileName: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate default pattern image
function generateDefaultPatternImage(pattern) {
  // In a real implementation, this would generate an SVG or image
  // For this example, we'll return a placeholder URL
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='100' y='100' font-family='Arial' font-size='14' text-anchor='middle'%3E${pattern.inhale}-${pattern.hold}-${pattern.exhale}-${pattern.rest}%3C/text%3E%3C/svg%3E`;
}

// Helper function to get network info
const getNetworkInfo = () => {
  const networkName = process.env.NETWORK || "testnet";
  const network = STORY_NETWORKS[networkName] || STORY_NETWORKS.testnet;
  return {
    name: network.name,
    chainId: network.chainId,
    rpcUrl: network.rpcUrl,
    explorer: network.explorer,
    ipExplorer: "https://aeneid.explorer.story.foundation",
  };
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);

  // Log network information
  const networkInfo = getNetworkInfo();
  console.log(
    `Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`
  );
  console.log(`RPC URL: ${networkInfo.rpcUrl}`);
  console.log(`Block Explorer: ${networkInfo.explorer}`);
  console.log(`IP Explorer: ${networkInfo.ipExplorer}`);

  // Test Story Protocol client initialization
  const client = getStoryClient();
  if (client) {
    console.log("Story Protocol client initialized successfully");
  } else {
    console.warn("Warning: Story Protocol client failed to initialize");
    console.warn(
      "Make sure your .env file includes PRIVATE_KEY and RPC_URL for Story Aeneid Testnet"
    );
  }
});
