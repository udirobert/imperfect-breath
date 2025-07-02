import { testnet, mainnet } from "@lens-protocol/client";

// Environment configuration
const isProduction = import.meta.env.PROD;
export const environment = isProduction ? mainnet : testnet;

// Lens V3 App Configuration from environment
const LENS_APP_ADDRESS = import.meta.env.VITE_LENS_APP_ADDRESS || "";

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

  // Use test app address based on environment
  return isProduction ? TEST_APP_ADDRESSES.mainnet : TEST_APP_ADDRESSES.testnet;
};

// Export for backward compatibility (to be removed after migration)
export { LENS_APP_ADDRESS };
