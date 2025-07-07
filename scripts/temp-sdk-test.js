// Temporary script to inspect the Story Protocol SDK
import { StoryClient } from "@story-protocol/core-sdk";
import { http, createPublicClient, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import util from "util";

console.log("===== STORY PROTOCOL SDK INSPECTION =====");

// Inspect the exported client class
console.log("\n1. StoryClient constructor:");
console.log(StoryClient.toString());

// Check class properties and methods
console.log("\n2. StoryClient static properties:");
console.log(Object.getOwnPropertyNames(StoryClient));

// Check instance properties
console.log("\n3. StoryClient prototype methods:");
console.log(Object.getOwnPropertyNames(StoryClient.prototype));

// Define a test chain
const testChain = {
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
};

// Create a proper instance if credentials are available
try {
  // Using a dummy private key for testing structure only
  const dummyPrivateKey =
    "0x0000000000000000000000000000000000000000000000000000000000000001";
  const transport = http("https://aeneid.storyrpc.io");

  // Create a public client
  const publicClient = createPublicClient({
    chain: testChain,
    transport,
  });

  // Create a wallet client
  const account = privateKeyToAccount(dummyPrivateKey);
  const walletClient = createWalletClient({
    account,
    chain: testChain,
    transport,
  });

  // Create the client
  const client = new StoryClient({
    chain: testChain,
    transport,
    publicClient,
    walletClient,
  });

  console.log("\n4. Successfully created client instance");
  console.log("Client structure:", Object.keys(client));

  // Inspect ipAsset methods
  if (client.ipAsset) {
    console.log("\n5. ipAsset methods:");
    console.log(
      Object.getOwnPropertyNames(Object.getPrototypeOf(client.ipAsset))
    );

    // More detailed inspection of specific methods
    if (typeof client.ipAsset.register === "function") {
      console.log("\n   ipAsset.register() details:");
      console.log(client.ipAsset.register.toString().substring(0, 500) + "...");
    }

    if (typeof client.ipAsset.get === "function") {
      console.log("\n   ipAsset.get() details:");
      console.log(client.ipAsset.get.toString().substring(0, 500) + "...");
    }
  }

  // Inspect license methods
  if (client.license) {
    console.log("\n6. license methods:");
    console.log(
      Object.getOwnPropertyNames(Object.getPrototypeOf(client.license))
    );

    // More detailed inspection of setTerms
    if (typeof client.license.setTerms === "function") {
      console.log("\n   license.setTerms() details:");
      console.log(client.license.setTerms.toString().substring(0, 500) + "...");
    }
  }

  // Inspect royalty methods if available
  if (client.royalty) {
    console.log("\n7. royalty methods:");
    console.log(
      Object.getOwnPropertyNames(Object.getPrototypeOf(client.royalty))
    );
  }

  // Inspect module methods if available
  if (client.module) {
    console.log("\n8. module methods:");
    console.log(
      Object.getOwnPropertyNames(Object.getPrototypeOf(client.module))
    );
  }

  // Inspect derivatives/relationship methods if available
  if (client.relationships || client.derivative) {
    console.log("\n9. relationship/derivative methods:");
    const relModule = client.relationships || client.derivative;
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(relModule)));
  }
} catch (err) {
  console.log("\n4. Client initialization error:", err.message);
  console.log("Stack trace:", err.stack);
}

// Document expected client namespaces based on documentation
console.log("\n10. Expected client namespaces from documentation:");
console.log(
  ["ipAsset", "license", "royalty", "module", "relationships"].join(", ")
);

console.log("\n=======================================");
