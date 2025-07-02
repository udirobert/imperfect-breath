import { ReactNode } from "react";

// TODO: Implement proper Lens SDK integration when stable
// For now, this is a placeholder provider to avoid conflicts

export function LensProvider({ children }: { children: ReactNode }) {
  // Simple passthrough provider until Lens SDK is properly configured
  return <>{children}</>;
}
