import React from "react";
import { useAccount } from "wagmi";
import { Link, useNavigate } from "react-router-dom";
import EnhancedLensTest from "@/components/tests/EnhancedLensTest";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Page to test the enhanced Lens client integration
 * Shows connection state and allows testing all enhanced Lens features
 */
export default function EnhancedLensTestPage() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Enhanced Lens Protocol Integration
          </CardTitle>
          <CardDescription>
            Testing the improved Lens Protocol integration with enhanced error
            handling, retries, caching, and monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <h3 className="text-xl font-medium">
                Connect your wallet to get started
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                You need to connect a wallet with a Lens Protocol account to
                test the enhanced integration. If you don't have a Lens account,
                you can still test error handling.
              </p>
              <WalletConnection />
            </div>
          ) : (
            <EnhancedLensTest />
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <h3 className="font-semibold mb-2">Enhanced Lens Client Features:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Robust error handling with typed errors</li>
          <li>
            Automatic retry with exponential backoff for transient failures
          </li>
          <li>Smart caching for expensive social data operations</li>
          <li>Performance monitoring for social operations</li>
          <li>Graceful degradation when API endpoints are unavailable</li>
          <li>Storage resilience with fallback strategies</li>
        </ul>
      </div>
    </div>
  );
}
