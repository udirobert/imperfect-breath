import { LensProvider as CoreLensProvider, PublicClient, development } from "@lens-protocol/react";
import { ReactNode } from "react";

// Define GraphQL fragments (as per Lens documentation)
// For a real app, these would be in separate files and imported.
const fragments = [];

const client = PublicClient.create({
  environment: development, // Use development for testnet
  fragments,
  storage: typeof window !== "undefined" ? window.localStorage : undefined, // Persist session
});

export function LensProvider({ children }: { children: ReactNode }) {
  return <CoreLensProvider config={client}>{children}</CoreLensProvider>;
}
