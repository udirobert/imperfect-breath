import { testnet, mainnet } from "@lens-protocol/client";

// Environment configuration
const isProduction = import.meta.env.PROD;
// Use mainnet by default since most real Lens profiles are there
export const environment = mainnet;

// Lens V3 App Configuration from environment
const LENS_APP_ADDRESS = import.meta.env.VITE_LENS_APP_ADDRESS || "";

// Lens Hub Contract Address for different networks
export const LENS_HUB_CONTRACT_ADDRESS =
  isProduction
    ? "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d" // Mainnet
    : "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82"; // Testnet/Mumbai

// Lens Hub ABI - minimal version with required methods
export const LENS_HUB_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "profileIds",
        "type": "uint256[]"
      },
      {
        "internalType": "bytes[]",
        "name": "datas",
        "type": "bytes[]"
      }
    ],
    "name": "follow",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getProfileIdsByAddress",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "profileId",
        "type": "uint256"
      }
    ],
    "name": "getFollowerCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

if (!import.meta.env.VITE_LENS_APP_ADDRESS) {
  console.warn(
    "VITE_LENS_APP_ADDRESS not set in environment, using test app address",
  );
}

// Test app addresses for different environments (from Lens V3 docs)
export const TEST_APP_ADDRESSES = {
  mainnet: "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE",
  testnet: "0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7",
} as const;

// Get the appropriate app address
export const getAppAddress = () => {
  // Use custom app address if provided and not the old fallback
  if (
    LENS_APP_ADDRESS &&
    LENS_APP_ADDRESS !== "DF7gzk-zW-C24tTtRamHCwj8VCuSZ40erZ"
  ) {
    return LENS_APP_ADDRESS;
  }

  // Use mainnet app address by default since most profiles are there
  return TEST_APP_ADDRESSES.mainnet;
};

// Export for backward compatibility (to be removed after migration)
export { LENS_APP_ADDRESS };
