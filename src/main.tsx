import "./polyfills"; // Must be first import
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LensProvider } from "./providers/LensProvider";
import { config } from "./lib/wagmi";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <LensProvider>
        <App />
      </LensProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
