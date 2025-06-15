// Test file to verify Story Protocol demo integration works
import { demoStoryIntegration } from './storyClient';

// Test breathing pattern registration
export const testPatternRegistration = async () => {
  console.log("🧪 Testing Story Protocol Pattern Registration Demo");
  
  const testPattern = {
    id: "test_pattern_123",
    name: "Test 4-7-8 Breathing",
    description: "A test breathing pattern for demo purposes",
    creator: "Demo User",
    category: "stress",
    phases: [
      { name: "inhale", duration: 4000 },
      { name: "hold", duration: 7000 },
      { name: "exhale", duration: 8000 }
    ]
  };

  try {
    const ipAssetId = await demoStoryIntegration.registerPatternDemo(testPattern);
    console.log("✅ Test passed! IP Asset ID:", ipAssetId);
    return ipAssetId;
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
};

// Test session data registration
export const testSessionRegistration = async () => {
  console.log("🧪 Testing Story Protocol Session Registration Demo");
  
  const testSession = {
    sessionId: "test_session_456",
    patternName: "4-7-8 Breathing",
    duration: 120,
    breathHoldTime: 15,
    restlessnessScore: 25,
    timestamp: new Date().toISOString()
  };

  try {
    const ipAssetId = await demoStoryIntegration.registerSessionDemo(testSession);
    console.log("✅ Test passed! Session IP Asset ID:", ipAssetId);
    return ipAssetId;
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log("🚀 Running Story Protocol Demo Tests");
  
  try {
    await testPatternRegistration();
    await testSessionRegistration();
    console.log("🎉 All Story Protocol demo tests passed!");
  } catch (error) {
    console.error("💥 Demo tests failed:", error);
  }
};

// Auto-run tests in development
if (import.meta.env.DEV) {
  console.log("🔧 Development mode detected - Story Protocol demo ready");
}
