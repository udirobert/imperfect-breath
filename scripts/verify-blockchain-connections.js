#!/usr/bin/env node

/**
 * Blockchain Connection Verification Script
 *
 * This script validates connections to all three blockchain networks
 * used in the application after the Lens V3 migration:
 * - Flow Testnet
 * - Story Aeneid Testnet
 * - Lens Chain Testnet
 *
 * Usage:
 *   node scripts/verify-blockchain-connections.js [--network=<network>]
 *
 * Options:
 *   --network=<network>  Only test a specific network (flow, story, lens)
 *   --api-only           Only test API endpoints without blockchain connection
 *   --wallet-only        Only test wallet integration
 *   --verbose            Show detailed results including errors
 *
 * @version 1.0.0
 * @updated 2025-05-07
 */

const { resolve } = require("path");
const chalk = require("chalk");

// Import verification utilities
const {
  verifyFlowConnection,
  verifyStoryConnection,
  verifyLensConnection,
  verifyApiEndpoints,
  verifyWalletIntegration,
  runBlockchainVerificationTests,
} = require("../src/utils/blockchain-verifier");

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  network: null,
  apiOnly: false,
  walletOnly: false,
  verbose: false,
};

args.forEach((arg) => {
  if (arg.startsWith("--network=")) {
    options.network = arg.split("=")[1];
  } else if (arg === "--api-only") {
    options.apiOnly = true;
  } else if (arg === "--wallet-only") {
    options.walletOnly = true;
  } else if (arg === "--verbose") {
    options.verbose = true;
  }
});

// Helper function to log results
function logResult(name, result) {
  const icon = result.success ? chalk.green("✓") : chalk.red("✗");
  console.log(`${icon} ${name}: ${result.message}`);

  if (options.verbose && result.details) {
    console.log(chalk.gray("  Details:"));
    console.log(
      chalk.gray(
        "  " + JSON.stringify(result.details, null, 2).replace(/\n/g, "\n  ")
      )
    );
  }

  if (!result.success && options.verbose) {
    console.log(chalk.red(`  Error: ${result.message}`));
  }
}

// Main function
async function main() {
  console.log(chalk.bold("\n🔍 Blockchain Connection Verification\n"));

  try {
    if (options.apiOnly) {
      // Only test API endpoints
      const apiResult = await verifyApiEndpoints();
      logResult("API Endpoints", apiResult);
      process.exit(apiResult.success ? 0 : 1);
    } else if (options.walletOnly) {
      // Only test wallet integration
      const walletResult = await verifyWalletIntegration();
      logResult("Wallet Integration", walletResult);
      process.exit(walletResult.success ? 0 : 1);
    } else if (options.network) {
      // Test specific network
      let result;

      switch (options.network.toLowerCase()) {
        case "flow":
          result = await verifyFlowConnection();
          logResult("Flow Testnet", result);
          break;
        case "story":
          result = await verifyStoryConnection();
          logResult("Story Aeneid Testnet", result);
          break;
        case "lens":
          result = await verifyLensConnection();
          logResult("Lens Chain Testnet", result);
          break;
        default:
          console.error(chalk.red(`Unknown network: ${options.network}`));
          console.log(chalk.yellow("Available networks: flow, story, lens"));
          process.exit(1);
      }

      process.exit(result.success ? 0 : 1);
    } else {
      // Run full verification
      console.log(chalk.yellow("Running full blockchain verification...\n"));

      const allResults = await Promise.all([
        verifyFlowConnection(),
        verifyStoryConnection(),
        verifyLensConnection(),
        verifyApiEndpoints(),
        verifyWalletIntegration(),
      ]);

      logResult("Flow Testnet", allResults[0]);
      logResult("Story Aeneid Testnet", allResults[1]);
      logResult("Lens Chain Testnet", allResults[2]);
      logResult("API Endpoints", allResults[3]);
      logResult("Wallet Integration", allResults[4]);

      const allSuccess = allResults.every((r) => r.success);

      console.log("\n");
      if (allSuccess) {
        console.log(chalk.green.bold("✅ All verifications passed!"));
      } else {
        console.log(chalk.red.bold("❌ Some verifications failed!"));
      }

      process.exit(allSuccess ? 0 : 1);
    }
  } catch (error) {
    console.error(chalk.red("\n❌ Error running verification:"));
    console.error(chalk.red(error.stack || error.message));
    process.exit(1);
  }
}

// Run the script
main();
