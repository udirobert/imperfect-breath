import { PublicClient } from "@lens-protocol/client";
import { environment, getAppAddress } from "./config";

// Create Lens V3 client with localStorage storage
export const lensClient = PublicClient.create({
  environment,
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

// Re-export the app address getter for convenience
export { getAppAddress };
