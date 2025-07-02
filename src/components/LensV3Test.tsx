import React, { useState } from "react";
import { useSession, useLogin, useLogout } from "@lens-protocol/react-web";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LENS_APP_ADDRESS } from "@/lib/lens/config";

export const LensV3Test: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Lens V3 hooks - let's see what actually exists
  const {
    data: session,
    loading: sessionLoading,
    error: sessionError,
  } = useSession();
  const {
    execute: loginExecute,
    loading: loginLoading,
    error: loginError,
  } = useLogin();
  const { execute: logoutExecute, loading: logoutLoading } = useLogout();

  const addTestResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
    setError(null);
  };

  const testWalletConnection = async () => {
    try {
      setLoading(true);
      addTestResult("Testing wallet connection...");

      if (!isConnected) {
        connect({ connector: injected() });
        addTestResult("Wallet connection initiated");
      } else {
        addTestResult(`Wallet connected: ${address}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      addTestResult(`Wallet error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const testLensSession = async () => {
    try {
      setLoading(true);
      addTestResult("Testing Lens session...");
      addTestResult(`Session loading: ${sessionLoading}`);
      addTestResult(`Session data: ${JSON.stringify(session, null, 2)}`);
      addTestResult(`Session error: ${sessionError?.message || "none"}`);
      addTestResult(`App address: ${LENS_APP_ADDRESS}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      addTestResult(`Session test error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const testLensLogin = async () => {
    if (!isConnected || !address) {
      setError("Please connect wallet first");
      return;
    }

    try {
      setLoading(true);
      addTestResult("Testing Lens login...");
      addTestResult(`Using app address: ${LENS_APP_ADDRESS}`);
      addTestResult(`User address: ${address}`);

      // Let's try different login parameter patterns
      const loginAttempts = [
        // Attempt 1: Required address parameter
        () => loginExecute({ address }),

        // Attempt 2: Using any to bypass type checking for exploration
        () =>
          (loginExecute as typeof loginExecute)({
            address,
            app: LENS_APP_ADDRESS,
          } as Parameters<typeof loginExecute>[0]),

        // Attempt 3: Alternative structures (bypassing types for exploration)
        () =>
          (loginExecute as typeof loginExecute)({
            wallet: address,
            appId: LENS_APP_ADDRESS,
          } as unknown as Parameters<typeof loginExecute>[0]),

        // Attempt 4: Onboarding user pattern
        () =>
          (loginExecute as typeof loginExecute)({
            onboardingUser: {
              app: LENS_APP_ADDRESS,
              wallet: address,
            },
          } as unknown as Parameters<typeof loginExecute>[0]),
      ];

      for (let i = 0; i < loginAttempts.length; i++) {
        try {
          addTestResult(`Login attempt ${i + 1}...`);
          const result = await loginAttempts[i]();
          addTestResult(
            `Login attempt ${i + 1} result: ${JSON.stringify(result, null, 2)}`,
          );
          break; // If successful, break out of loop
        } catch (attemptError) {
          addTestResult(
            `Login attempt ${i + 1} failed: ${attemptError instanceof Error ? attemptError.message : "Unknown error"}`,
          );
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      addTestResult(`Login error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const testLensLogout = async () => {
    try {
      setLoading(true);
      addTestResult("Testing Lens logout...");

      const result = await logoutExecute();
      addTestResult(`Logout result: ${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      addTestResult(`Logout error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const testSDKExports = () => {
    addTestResult("Testing SDK exports...");

    // Test what's actually available
    try {
      addTestResult(
        `useSession available: ${typeof useSession === "function"}`,
      );
      addTestResult(`useLogin available: ${typeof useLogin === "function"}`);
      addTestResult(`useLogout available: ${typeof useLogout === "function"}`);

      // Try to inspect the login hook
      addTestResult(`loginExecute type: ${typeof loginExecute}`);
      addTestResult(`loginLoading: ${loginLoading}`);
      addTestResult(`loginError: ${loginError?.message || "none"}`);
    } catch (err) {
      addTestResult(
        `SDK inspection error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Lens V3 SDK Test Suite
          <Badge variant={session ? "default" : "secondary"}>
            {session ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Wallet Status</h3>
            <p className="text-sm">
              {isConnected
                ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`
                : "Not Connected"}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Session Status</h3>
            <p className="text-sm">
              {sessionLoading
                ? "Loading..."
                : session
                  ? "Active Session"
                  : "No Session"}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">App Address</h3>
            <p className="text-xs break-all">{LENS_APP_ADDRESS}</p>
          </Card>
        </div>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={testWalletConnection}
            disabled={loading}
            variant={isConnected ? "secondary" : "default"}
          >
            {isConnected ? "Test Wallet" : "Connect Wallet"}
          </Button>

          <Button
            onClick={testLensSession}
            disabled={loading}
            variant="outline"
          >
            Test Session
          </Button>

          <Button
            onClick={testLensLogin}
            disabled={loading || !isConnected}
            variant="default"
          >
            Test Login
          </Button>

          <Button
            onClick={testLensLogout}
            disabled={loading}
            variant="destructive"
          >
            Test Logout
          </Button>

          <Button onClick={testSDKExports} disabled={loading} variant="outline">
            Test SDK
          </Button>

          <Button onClick={clearResults} variant="ghost">
            Clear
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        {/* Results Display */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Test Results</h3>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">
                No test results yet. Click a test button to start.
              </p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* SDK Information */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">SDK Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>Session Loading:</strong> {sessionLoading.toString()}
              </p>
              <p>
                <strong>Session Error:</strong>{" "}
                {sessionError?.message || "None"}
              </p>
              <p>
                <strong>Login Loading:</strong> {loginLoading.toString()}
              </p>
              <p>
                <strong>Login Error:</strong> {loginError?.message || "None"}
              </p>
            </div>
            <div>
              <p>
                <strong>Logout Loading:</strong> {logoutLoading.toString()}
              </p>
              <p>
                <strong>Session Data:</strong> {session ? "Present" : "None"}
              </p>
              <p>
                <strong>Wallet Connected:</strong> {isConnected.toString()}
              </p>
              <p>
                <strong>Environment:</strong> Development
              </p>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};
