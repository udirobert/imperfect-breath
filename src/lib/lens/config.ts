import { LensConfig, production, development } from "@lens-protocol/react-web";
import { bindings } from "@lens-protocol/wagmi";
import { wagmiConfig } from "@/lib/wagmi/config";

// Lens V3 App Configuration from environment
const LENS_APP_ADDRESS =
  import.meta.env.VITE_LENS_APP_ADDRESS || "DF7gzk-zW-C24tTtRamHCwj8VCuSZ40erZ";

if (!import.meta.env.VITE_LENS_APP_ADDRESS) {
  console.warn(
    "VITE_LENS_APP_ADDRESS not set in environment, using fallback address",
  );
}

// Create Lens V3 configuration for development
export const lensConfig: LensConfig = {
  environment: development,
  bindings: bindings(wagmiConfig),
};

// Production configuration
export const lensProductionConfig: LensConfig = {
  environment: production,
  bindings: bindings(wagmiConfig),
};

// Development configuration (same as default for now)
export const lensDevelopmentConfig: LensConfig = {
  environment: development,
  bindings: bindings(wagmiConfig),
};

// Export the app address for use in authentication
export { LENS_APP_ADDRESS };
