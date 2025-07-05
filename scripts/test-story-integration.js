// Test script for Story Protocol integration
import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { useStory } from "../src/hooks/useStory";

// Simple test component
function StoryProtocolTest() {
  const {
    client,
    isLoading,
    error,
    registerBreathingPatternIP,
    getUserIPAssets,
  } = useStory();
  const [testState, setTestState] = useState("initializing");
  const [ipAssets, setIpAssets] = useState([]);
  const [registrationResult, setRegistrationResult] = useState(null);

  // Test registration function
  const testRegistration = async () => {
    if (!client) {
      setTestState("error");
      console.error("Client not initialized");
      return;
    }

    try {
      setTestState("registering");

      // Create test breathing pattern
      const result = await registerBreathingPatternIP({
        name: "Test Breathing Pattern",
        description: "A test pattern created via the Story Protocol SDK",
        creator: "0xYourWalletAddress", // Replace with actual address
        patternPhases: {
          inhale: 4,
          hold: 4,
          exhale: 4,
          pause: 2,
        },
      });

      setRegistrationResult(result);
      setTestState("registered");
      console.log("Registration successful:", result);

      // Test fetching assets
      const assets = await getUserIPAssets("0xYourWalletAddress"); // Replace with actual address
      setIpAssets(assets);
      console.log("User IP assets:", assets);

      setTestState("complete");
    } catch (error) {
      setTestState("error");
      console.error("Registration failed:", error);
    }
  };

  // Run tests once client is initialized
  useEffect(() => {
    if (client && testState === "initializing") {
      console.log("Story Protocol client initialized, starting test...");
      testRegistration();
    }
  }, [client, testState]);

  // Render test UI
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Story Protocol Integration Test</h1>
      <div>
        <h2>Status: {testState}</h2>
        {error && <div style={{ color: "red" }}>Error: {error}</div>}
        {isLoading && <div>Loading...</div>}
      </div>

      {registrationResult && (
        <div>
          <h2>Registration Result:</h2>
          <pre>{JSON.stringify(registrationResult, null, 2)}</pre>
        </div>
      )}

      {ipAssets.length > 0 && (
        <div>
          <h2>User IP Assets:</h2>
          <pre>{JSON.stringify(ipAssets, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// Mount test component
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<StoryProtocolTest />);

console.log("Story Protocol integration test initialized");
