import React, { useState, useEffect } from "react";
import { useLens } from "@/hooks/useLens";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw, XCircle } from "lucide-react";

/**
 * Test component for the enhanced Lens client
 * This component allows testing authentication, data fetching, and error handling
 */
export default function EnhancedLensTest() {
  const {
    // Authentication
    isAuthenticated,
    currentAccount,

    // Loading states
    isLoading,
    isAuthenticating,

    // Error handling
    error,
    errorType,
    clearError,

    // Authentication actions
    authenticate,
    logout,

    // Data fetching
    getTimeline,
    getFollowers,
    getFollowing,

    // Social actions
    shareBreathingSession,
    shareBreathingPattern,
    followAccount,
    unfollowAccount,
    commentOnPost,

    // Utilities
    refreshData,
    invalidateCache,
  } = useLens();

  const [testResults, setTestResults] = useState<
    {
      name: string;
      status: "success" | "error" | "pending";
      message?: string;
    }[]
  >([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [followersData, setFollowersData] = useState<any[]>([]);

  const addTestResult = (
    name: string,
    status: "success" | "error" | "pending",
    message?: string
  ) => {
    setTestResults((prev) => [...prev, { name, status, message }]);
  };

  const clearResults = () => {
    setTestResults([]);
    setTimelineData([]);
    setFollowersData([]);
    clearError();
  };

  // Test authentication
  const testAuthentication = async () => {
    clearResults();
    addTestResult("Authentication", "pending");

    try {
      await authenticate();
      addTestResult(
        "Authentication",
        "success",
        `Authenticated as ${
          currentAccount?.username || currentAccount?.address
        }`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addTestResult("Authentication", "error", errorMessage);
    }
  };

  // Test logout
  const testLogout = async () => {
    clearResults();
    addTestResult("Logout", "pending");

    try {
      await logout();
      addTestResult("Logout", "success", "Successfully logged out");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addTestResult("Logout", "error", errorMessage);
    }
  };

  // Test timeline fetching
  const testTimeline = async () => {
    if (!isAuthenticated || !currentAccount) {
      addTestResult("Timeline Fetch", "error", "Not authenticated");
      return;
    }

    clearResults();
    addTestResult("Timeline Fetch", "pending");

    try {
      const timeline = await getTimeline(currentAccount.address);
      setTimelineData(timeline);
      addTestResult(
        "Timeline Fetch",
        "success",
        `Retrieved ${timeline.length} posts`
      );

      // Test cache by fetching again (should be faster)
      const startTime = performance.now();
      await getTimeline(currentAccount.address);
      const endTime = performance.now();

      addTestResult(
        "Timeline Cache",
        "success",
        `Cached fetch took ${(endTime - startTime).toFixed(2)}ms`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addTestResult("Timeline Fetch", "error", errorMessage);
    }
  };

  // Test followers fetching
  const testFollowers = async () => {
    if (!isAuthenticated || !currentAccount) {
      addTestResult("Followers Fetch", "error", "Not authenticated");
      return;
    }

    clearResults();
    addTestResult("Followers Fetch", "pending");

    try {
      const followers = await getFollowers(currentAccount.address);
      setFollowersData(followers);
      addTestResult(
        "Followers Fetch",
        "success",
        `Retrieved ${followers.length} followers`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addTestResult("Followers Fetch", "error", errorMessage);
    }
  };

  // Test sharing a breathing session
  const testShareSession = async () => {
    if (!isAuthenticated) {
      addTestResult("Share Session", "error", "Not authenticated");
      return;
    }

    clearResults();
    addTestResult("Share Session", "pending");

    const testSession = {
      patternName: "Box Breathing",
      duration: 300, // 5 minutes
      score: 85,
      insights: ["Improved focus", "Reduced stress", "Enhanced clarity"],
      id: `test-${Date.now()}`,
    };

    try {
      const result = await shareBreathingSession(testSession);

      if (result.success) {
        addTestResult(
          "Share Session",
          "success",
          `Post created with hash: ${result.hash}`
        );
      } else {
        addTestResult(
          "Share Session",
          "error",
          result.error || "Unknown error"
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addTestResult("Share Session", "error", errorMessage);
    }
  };

  // Test error handling
  const testErrorHandling = async () => {
    clearResults();
    addTestResult("Error Handling", "pending");

    try {
      // Attempt to get timeline without authentication to trigger error
      if (!isAuthenticated) {
        // @ts-ignore - Intentionally cause an error for testing
        await getTimeline("0x0000000000000000000000000000000000000000");
      } else {
        // Test invalid operation while authenticated
        // @ts-ignore - Intentionally cause an error for testing
        await commentOnPost("invalid-post-id", "This should fail");
      }
    } catch (err) {
      // We expect an error here, so this is actually a success case for our test
      addTestResult(
        "Error Handling",
        "success",
        `Error correctly handled: ${error}`
      );
      return;
    }

    // If we get here, no error was thrown, which is unexpected
    addTestResult(
      "Error Handling",
      "error",
      "Expected error but none occurred"
    );
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Lens Client Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Authentication Status:</span>
              {isAuthenticated ? (
                <Badge variant="outline" className="bg-green-500 text-white">
                  Authenticated
                </Badge>
              ) : (
                <Badge variant="destructive">Not Authenticated</Badge>
              )}
            </div>

            {currentAccount && (
              <div className="space-y-1">
                <span className="font-medium">Current Account:</span>
                <pre className="bg-muted p-2 rounded-md text-sm">
                  {JSON.stringify(currentAccount, null, 2)}
                </pre>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error: {errorType}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              onClick={testAuthentication}
              disabled={isLoading || isAuthenticating}
            >
              {isAuthenticating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Test Authentication
            </Button>

            <Button
              onClick={testLogout}
              disabled={isLoading || !isAuthenticated}
            >
              Test Logout
            </Button>

            <Button
              onClick={testTimeline}
              disabled={isLoading || !isAuthenticated}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Test Timeline
            </Button>

            <Button
              onClick={testFollowers}
              disabled={isLoading || !isAuthenticated}
            >
              Test Followers
            </Button>

            <Button
              onClick={testShareSession}
              disabled={isLoading || !isAuthenticated}
            >
              Test Share Session
            </Button>

            <Button onClick={testErrorHandling} disabled={isLoading}>
              Test Error Handling
            </Button>

            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-muted rounded-md"
                >
                  {result.status === "pending" && (
                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                  )}
                  {result.status === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {result.status === "error" && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{result.name}</div>
                    {result.message && (
                      <div className="text-sm opacity-80">{result.message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Data */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timelineData.slice(0, 5).map((post, index) => (
                <div key={index} className="p-3 bg-muted rounded-md">
                  <div className="font-medium">
                    {post.author.username || post.author.address}
                  </div>
                  <div className="mt-2">{post.content}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Likes: {post.engagement.likes} • Comments:{" "}
                    {post.engagement.comments}
                  </div>
                </div>
              ))}
              {timelineData.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{timelineData.length - 5} more posts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Followers Data */}
      {followersData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Followers Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {followersData.slice(0, 10).map((follower, index) => (
                <div key={index} className="p-3 bg-muted rounded-md">
                  <div className="font-medium">
                    {follower.username || "Unnamed"}
                  </div>
                  <div className="text-sm opacity-80">{follower.address}</div>
                </div>
              ))}
              {followersData.length > 10 && (
                <div className="text-center text-sm text-muted-foreground col-span-2">
                  +{followersData.length - 10} more followers
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
