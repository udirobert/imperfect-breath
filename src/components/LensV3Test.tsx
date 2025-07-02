import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLensAuth } from "@/hooks/useLensAuth";
import { getAppAddress } from "@/lib/lens/config";

export const LensV3Test: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Lens V3 client hooks
  const {
    session,
    loading: lensLoading,
    error: lensError,
    login: lensLogin,
    logout: lensLogout,
    resumeSession,
    getCurrentSession,
  } = useLensAuth();

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

  // Try to resume session on component mount
  useEffect(() => {
    resumeSession();
  }, [resumeSession]);

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
      addTestResult("Testing Lens V3 session...");
      addTestResult(`Session loading: ${lensLoading}`);
      addTestResult(`Session data: ${JSON.stringify(session, null, 2)}`);
      addTestResult(`Session error: ${lensError || "none"}`);
      addTestResult(`App address: ${getAppAddress()}`);

      // Try to get current session details
      const currentSession = await getCurrentSession();
      if (currentSession) {
        addTestResult(
          `Current session: ${JSON.stringify(currentSession, null, 2)}`,
        );
      } else {
        addTestResult("No active authenticated session");
      }
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
      addTestResult("Testing Lens V3 login with GraphQL flow...");
      addTestResult(`Using app address: ${getAppAddress()}`);
      addTestResult(`User address: ${address}`);

      addTestResult("Starting challenge/sign/authenticate flow...");

      const success = await lensLogin();

      if (success) {
        addTestResult("Login successful!");
        addTestResult(`New session: ${JSON.stringify(session, null, 2)}`);
      } else {
        addTestResult("Login failed - check error details above");
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
      addTestResult("Testing Lens V3 logout...");

      const success = await lensLogout();

      if (success) {
        addTestResult("Logout successful!");
        addTestResult(`Updated session: ${JSON.stringify(session, null, 2)}`);
      } else {
        addTestResult("Logout failed - check error details above");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      addTestResult(`Logout error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const testSDKExports = () => {
    addTestResult("Testing V3 Client SDK exports...");

    // Test what's actually available
    try {
      addTestResult(
        `useLensAuth available: ${typeof useLensAuth === "function"}`,
      );
      addTestResult(`lensLogin type: ${typeof lensLogin}`);
      addTestResult(`lensLogout type: ${typeof lensLogout}`);
      addTestResult(`resumeSession type: ${typeof resumeSession}`);
      addTestResult(`getCurrentSession type: ${typeof getCurrentSession}`);

      addTestResult(`Current loading state: ${lensLoading}`);
      addTestResult(`Current error: ${lensError || "none"}`);
      addTestResult(`Session authenticated: ${session.isAuthenticated}`);
      addTestResult(`Session type: ${session.sessionType}`);
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
          Lens V3 Client SDK Test Suite
          <Badge variant={session.isAuthenticated ? "default" : "secondary"}>
            {session.isAuthenticated ? "Authenticated" : "Not Authenticated"}
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
              {lensLoading
                ? "Loading..."
                : session.isAuthenticated
                  ? `Active Session (${session.sessionType})`
                  : "No Session"}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">App Address</h3>
            <p className="text-xs break-all">{getAppAddress()}</p>
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
                <strong>Session Loading:</strong> {lensLoading.toString()}
              </p>
              <p>
                <strong>Session Error:</strong> {lensError || "None"}
              </p>
              <p>
                <strong>Session Authenticated:</strong>{" "}
                {session.isAuthenticated.toString()}
              </p>
              <p>
                <strong>Session Type:</strong> {session.sessionType || "None"}
              </p>
            </div>
            <div>
              <p>
                <strong>Has Profile:</strong>{" "}
                {session.hasProfile?.toString() || "Unknown"}
              </p>
              <p>
                <strong>Has Tokens:</strong>{" "}
                {session.accessToken ? "Yes" : "No"}
              </p>
              <p>
                <strong>Wallet Connected:</strong> {isConnected.toString()}
              </p>
              <p>
                <strong>Environment:</strong> Development (V3 Client SDK)
              </p>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};
