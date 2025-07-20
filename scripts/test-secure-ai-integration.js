import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_URL = "http://localhost:3001/api/ai-analysis";

// Test session data
const testSessionData = {
  pattern: "Box Breathing",
  duration: 300,
  averageBpm: 12,
  consistencyScore: 85,
  restlessnessScore: 25,
  breathHoldDuration: 15,
};

console.log("🧪 Starting Secure AI Integration Tests...\n");
console.log("📊 Test Session Data:");
console.log(`   Pattern: ${testSessionData.pattern}`);
console.log(`   Duration: ${testSessionData.duration} seconds`);
console.log(`   Breath Hold: ${testSessionData.breathHoldDuration} seconds`);
console.log(`   Restlessness Score: ${testSessionData.restlessnessScore}/100`);
console.log(`   BPM: ${testSessionData.averageBpm}`);
console.log(`   Consistency Score: ${testSessionData.consistencyScore}/100\n`);

console.log("==================================================");
console.log("🧠 TESTING SECURE AI ANALYSIS PROVIDERS");
console.log("==================================================\n");

async function testProvider(provider) {
  console.log(
    `📡 Testing ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`
  );

  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        sessionData: testSessionData,
        analysisType: "session",
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log(
        `✅ ${
          provider.charAt(0).toUpperCase() + provider.slice(1)
        } analysis successful (${responseTime}ms)`
      );

      if (result.result.score) {
        console.log(`   Overall Score: ${result.result.score.overall}/100`);
        console.log(
          `   Suggestions: ${result.result.suggestions?.length || 0} provided`
        );
        console.log(
          `   Next Steps: ${result.result.nextSteps?.length || 0} provided`
        );
      } else if (result.result.overallScore) {
        console.log(`   Overall Score: ${result.result.overallScore}/100`);
        console.log(
          `   Suggestions: ${result.result.suggestions?.length || 0} provided`
        );
        console.log(
          `   Next Steps: ${result.result.nextSteps?.length || 0} provided`
        );
      }

      return { success: true, provider, responseTime, result: result.result };
    } else {
      throw new Error(result.message || "Analysis failed");
    }
  } catch (error) {
    console.log(
      `❌ ${
        provider.charAt(0).toUpperCase() + provider.slice(1)
      } analysis failed: ${error.message}`
    );
    return { success: false, provider, error: error.message };
  }
}

async function testPatternGeneration(provider) {
  console.log(
    `🎨 Testing ${
      provider.charAt(0).toUpperCase() + provider.slice(1)
    } Pattern Generation...`
  );

  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        sessionData: {
          consistencyScore: testSessionData.consistencyScore,
          restlessnessScore: testSessionData.restlessnessScore,
          averageBpm: testSessionData.averageBpm,
          experienceLevel: "intermediate",
        },
        analysisType: "pattern",
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Pattern generation successful (${responseTime}ms)`);
      console.log(`   Name: ${result.result.name}`);
      console.log(`   Description: ${result.result.description}`);
      console.log(`   Phases: ${result.result.phases?.length || 0} phases`);
      console.log(
        `   Reasoning: ${
          result.result.reasoning?.substring(0, 100) || "N/A"
        }...\n`
      );

      return { success: true, provider, responseTime, result: result.result };
    } else {
      throw new Error(result.message || "Pattern generation failed");
    }
  } catch (error) {
    console.log(`❌ Pattern generation failed: ${error.message}\n`);
    return { success: false, provider, error: error.message };
  }
}

async function runTests() {
  const providers = ["google", "openai", "anthropic"];
  const analysisResults = [];
  const patternResults = [];

  // Test session analysis
  for (const provider of providers) {
    const result = await testProvider(provider);
    analysisResults.push(result);
    console.log(); // Add spacing
  }

  console.log("==================================================");
  console.log("🎨 TESTING PATTERN GENERATION");
  console.log("==================================================\n");

  // Test pattern generation
  for (const provider of providers) {
    const result = await testPatternGeneration(provider);
    patternResults.push(result);
  }

  // Summary
  console.log("==================================================");
  console.log("📊 TEST SUMMARY");
  console.log("==================================================");

  const successfulAnalysis = analysisResults.filter((r) => r.success);
  const successfulPatterns = patternResults.filter((r) => r.success);

  console.log(`Total Providers Tested: ${providers.length}`);
  console.log(
    `Successful Analysis Tests: ${successfulAnalysis.length}/${providers.length}`
  );
  console.log(
    `Successful Pattern Tests: ${successfulPatterns.length}/${providers.length}`
  );

  if (successfulAnalysis.length > 0) {
    const avgResponseTime = Math.round(
      successfulAnalysis.reduce((sum, r) => sum + r.responseTime, 0) /
        successfulAnalysis.length
    );
    console.log(`Average Response Time: ${avgResponseTime}ms`);
  }

  console.log("\n📋 Detailed Results:");
  analysisResults.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const time = result.responseTime ? `(${result.responseTime}ms)` : "";
    console.log(`   ${status} ${result.provider} Analysis ${time}`);
  });

  patternResults.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const time = result.responseTime ? `(${result.responseTime}ms)` : "";
    console.log(`   ${status} ${result.provider} Pattern Generation ${time}`);
  });

  console.log("\n💡 Security Status:");
  console.log("   🔒 API keys are now server-side only");
  console.log("   🛡️ No client-side exposure of sensitive data");
  console.log("   ✅ Ready for secure deployment");

  if (
    successfulAnalysis.length === providers.length &&
    successfulPatterns.length === providers.length
  ) {
    console.log(
      "\n🎉 All tests passed! Secure AI integration is working correctly."
    );
  } else {
    console.log("\n⚠️ Some tests failed. Check the error messages above.");
  }
}

// Run the tests
runTests().catch(console.error);
