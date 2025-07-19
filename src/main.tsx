import "./polyfills"; // Must be first import
import "./wallet-shim"; // Wallet compatibility layer must be loaded early
import React from "react"; // Explicitly import React to ensure it's available
import ReactDOM from "react-dom"; // Explicitly import ReactDOM to ensure it's available
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LensProvider } from "./providers/LensProvider";
import { config } from "./lib/wagmi";
import App from "./App.tsx";
import "./index.css";
import { runEnvironmentChecks } from "./utils/environment-check";
import { optimizeForMobile } from "./utils/mobile-detection";

// Explicitly set global references for old libraries that might expect them
window.React = React;
window.ReactDOM = ReactDOM;

// Run environment checks before initializing the app
const envCheck = runEnvironmentChecks();
console.log("Environment check results:", envCheck);

// Initialize mobile optimizations
optimizeForMobile();

// Create query client with retry options optimized for production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: process.env.NODE_ENV === "production" ? 3 : 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Error handling for the root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found! Application cannot mount.");
  // Create a fallback element to show an error message
  const fallbackElement = document.createElement("div");
  fallbackElement.innerHTML = `
    <div style="font-family: sans-serif; padding: 20px; text-align: center;">
      <h2>Application Error</h2>
      <p>The application could not initialize properly. Please refresh the page or contact support.</p>
    </div>
  `;
  document.body.appendChild(fallbackElement);
} else {
  try {
    createRoot(rootElement).render(
      <React.StrictMode>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <LensProvider>
              <App />
            </LensProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Error rendering the application:", error);
    rootElement.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h2>Application Error</h2>
        <p>An error occurred while rendering the application. Please refresh the page or contact support.</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 10px; overflow: auto;">${error?.toString()}</pre>
      </div>
    `;
  }
}
