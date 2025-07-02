import { LensClient, development } from "@lens-protocol/client";
import { fragments } from "./fragments";

export const lensClient = LensClient.create({
  environment: development, // Use development for testing
  origin: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:8080',
});

// Export the client for use in other modules