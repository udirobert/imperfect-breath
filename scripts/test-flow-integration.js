#!/usr/bin/env node

/**
 * Imperfect Breath - Flow Integration Test Script
 *
 * This script validates the Flow blockchain integration by testing:
 * - Environment configuration
 * - Contract deployment verification
 * - Basic contract interactions
 * - Frontend integration readiness
 */

import { config } from 'dotenv';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.purple}🌬️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔍 ${msg}${colors.reset}`)
};

class FlowIntegrationTester {
  constructor() {
    this.contractAddress = process.env.VITE_IMPERFECT_BREATH_ADDRESS || '0xb8404e09b36b6623';
    this.network = process.env.VITE_FLOW_NETWORK || 'testnet';
    this.accessNode = process.env.VITE_FLOW_ACCESS_API || 'https://rest-testnet.onflow.org';
    this.discoveryWallet = process.env.VITE_FLOW_DISCOVERY_WALLET || 'https://fcl-discovery.onflow.org/testnet/authn';

    this.testResults = {
      environment: false,
      fclConfig: false,
      contractExists: false,
      contractFunctions: false,
      scripts: false,
      overall: false
    };
  }

  async run() {
    log.header('Imperfect Breath - Flow Integration Test');
    console.log('========================================\n');

    try {
      await this.testEnvironment();
      await this.testFCLConfiguration();
      await this.testContractDeployment();
      await this.testContractFunctions();
      await this.testScriptExecution();

      this.generateReport();
    } catch (error) {
      log.error(`Test suite failed: ${error.message}`);
      process.exit(1);
    }
  }

  async testEnvironment() {
    log.step('Testing Environment Configuration');

    const requiredVars = [
      'VITE_FLOW_NETWORK',
      'VITE_FLOW_ACCESS_API',
      'VITE_IMPERFECT_BREATH_ADDRESS'
    ];

    const optionalVars = [
      'VITE_SUPABASE_URL',
      'VITE_GOOGLE_GEMINI_API_KEY',
      'VITE_FLOW_DISCOVERY_WALLET'
    ];

    let allRequired = true;

    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        log.success(`${varName}: ${value}`);
      } else {
        log.error(`${varName}: Not set (required)`);
        allRequired = false;
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      const value = process.env[varName];
      if (value && value !== 'your_key_here' && value !== 'https://your-project.supabase.co') {
        log.success(`${varName}: Configured`);
      } else {
        log.warning(`${varName}: Not configured (optional)`);
      }
    }

    // Validate contract address format
    if (this.contractAddress && !this.contractAddress.match(/^0x[a-fA-F0-9]{16}$/)) {
      log.error('Contract address format is invalid');
      allRequired = false;
    } else {
      log.success(`Contract address format is valid: ${this.contractAddress}`);
    }

    // Validate network
    if (!['testnet', 'mainnet', 'emulator'].includes(this.network)) {
      log.error(`Invalid network: ${this.network}`);
      allRequired = false;
    } else {
      log.success(`Network is valid: ${this.network}`);
    }

    this.testResults.environment = allRequired;
    console.log('');
  }

  async testFCLConfiguration() {
    log.step('Testing FCL Configuration');

    try {
      // Configure FCL
      fcl.config({
        'accessNode.api': this.accessNode,
        'discovery.wallet': this.discoveryWallet,
        '0xImperfectBreath': this.contractAddress
      });

      log.success('FCL configured successfully');

      // Test connection to access node
      const latestBlock = await fcl.send([fcl.getBlock(true)]).then(fcl.decode);
      log.success(`Connected to Flow ${this.network} - Latest block: ${latestBlock.height}`);

      this.testResults.fclConfig = true;
    } catch (error) {
      log.error(`FCL configuration failed: ${error.message}`);
      this.testResults.fclConfig = false;
    }

    console.log('');
  }

  async testContractDeployment() {
    log.step('Testing Contract Deployment');

    try {
      // Get account information
      const account = await fcl.send([fcl.getAccount(this.contractAddress)]).then(fcl.decode);

      if (account.contracts && account.contracts.ImperfectBreath) {
        log.success('ImperfectBreath contract found on account');
        log.success(`Account balance: ${(account.balance / 100000000).toFixed(2)} FLOW`);
        log.success(`Number of contracts: ${Object.keys(account.contracts).length}`);

        // List all contracts
        for (const contractName of Object.keys(account.contracts)) {
          log.info(`  - ${contractName}`);
        }

        this.testResults.contractExists = true;
      } else {
        log.error('ImperfectBreath contract not found on account');
        this.testResults.contractExists = false;
      }
    } catch (error) {
      log.error(`Failed to verify contract deployment: ${error.message}`);
      this.testResults.contractExists = false;
    }

    console.log('');
  }

  async testContractFunctions() {
    log.step('Testing Contract Functions');

    const tests = [
      this.testTotalSupply(),
      this.testCollectionPaths(),
      this.testCreateEmptyCollection()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed === 0) {
      log.success(`All ${passed} contract function tests passed`);
      this.testResults.contractFunctions = true;
    } else {
      log.error(`${failed} contract function tests failed, ${passed} passed`);
      this.testResults.contractFunctions = false;
    }

    console.log('');
  }

  async testTotalSupply() {
    const script = `
      import ImperfectBreath from ${this.contractAddress}

      access(all) fun main(): UInt64 {
        return ImperfectBreath.totalSupply
      }
    `;

    try {
      const result = await fcl.query({ cadence: script });
      log.success(`Total supply: ${result}`);
      return result;
    } catch (error) {
      log.error(`Total supply test failed: ${error.message}`);
      throw error;
    }
  }

  async testCollectionPaths() {
    const script = `
      import ImperfectBreath from ${this.contractAddress}

      access(all) fun main(): {String: String} {
        return {
          "CollectionStoragePath": ImperfectBreath.CollectionStoragePath.toString(),
          "CollectionPublicPath": ImperfectBreath.CollectionPublicPath.toString()
        }
      }
    `;

    try {
      const result = await fcl.query({ cadence: script });
      log.success(`Collection paths verified:`);
      log.info(`  Storage: ${result.CollectionStoragePath}`);
      log.info(`  Public: ${result.CollectionPublicPath}`);
      return result;
    } catch (error) {
      log.error(`Collection paths test failed: ${error.message}`);
      throw error;
    }
  }

  async testCreateEmptyCollection() {
    const script = `
      import ImperfectBreath from ${this.contractAddress}

      access(all) fun main(): String {
        let collection <- ImperfectBreath.createEmptyCollection()
        let isEmpty = collection.getIDs().length == 0
        destroy collection
        return isEmpty ? "Empty collection created successfully" : "Collection not empty"
      }
    `;

    try {
      const result = await fcl.query({ cadence: script });
      log.success(`Create collection test: ${result}`);
      return result;
    } catch (error) {
      log.error(`Create collection test failed: ${error.message}`);
      throw error;
    }
  }

  async testScriptExecution() {
    log.step('Testing Script Execution');

    try {
      // Test the collection IDs script with the deployed account
      const script = `
        import ImperfectBreath from ${this.contractAddress}

        access(all) fun main(account: Address): [UInt64] {
          let collection = getAccount(account).capabilities.get<&ImperfectBreath.Collection>(ImperfectBreath.CollectionPublicPath)
                              .borrow()

          if collection == nil {
            return []
          }

          return collection!.getIDs()
        }
      `;

      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(this.contractAddress, t.Address)]
      });

      log.success(`Collection query executed successfully`);
      log.info(`NFTs in deployed account: ${result.length}`);

      if (result.length > 0) {
        log.info(`NFT IDs: [${result.join(', ')}]`);
      }

      this.testResults.scripts = true;
    } catch (error) {
      // This might fail if the account doesn't have a collection setup, which is OK
      if (error.message.includes('Could not borrow')) {
        log.warning('Account collection not setup (this is expected for new deployments)');
        this.testResults.scripts = true;
      } else {
        log.error(`Script execution failed: ${error.message}`);
        this.testResults.scripts = false;
      }
    }

    console.log('');
  }

  generateReport() {
    log.header('Flow Integration Test Report');
    console.log('=====================================\n');

    const tests = [
      { name: 'Environment Configuration', result: this.testResults.environment },
      { name: 'FCL Configuration', result: this.testResults.fclConfig },
      { name: 'Contract Deployment', result: this.testResults.contractExists },
      { name: 'Contract Functions', result: this.testResults.contractFunctions },
      { name: 'Script Execution', result: this.testResults.scripts }
    ];

    let passedTests = 0;
    for (const test of tests) {
      if (test.result) {
        log.success(test.name);
        passedTests++;
      } else {
        log.error(test.name);
      }
    }

    console.log('');
    console.log(`📊 Results: ${passedTests}/${tests.length} tests passed`);

    // Overall assessment
    this.testResults.overall = passedTests === tests.length;

    if (this.testResults.overall) {
      log.success('🎉 All tests passed! Flow integration is ready.');
      console.log('');
      console.log('✨ Next steps:');
      console.log('   1. Start the development server: npm run dev');
      console.log('   2. Test wallet connection in the UI');
      console.log('   3. Try minting a breathing pattern NFT');
      console.log('   4. Test marketplace functionality');
    } else {
      log.error('❌ Some tests failed. Please review the errors above.');
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   1. Check your .env file configuration');
      console.log('   2. Verify contract deployment on Flow explorer');
      console.log('   3. Ensure network connectivity');
      console.log('   4. Check Flow network status');
    }

    console.log('');
    console.log('🔗 Useful links:');
    console.log(`   Contract Explorer: https://testnet.flowscan.org/account/${this.contractAddress}`);
    console.log('   Flow Documentation: https://developers.flow.com/');
    console.log('   FCL Documentation: https://developers.flow.com/tools/clients/fcl-js');

    // Exit with appropriate code
    process.exit(this.testResults.overall ? 0 : 1);
  }
}

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FlowIntegrationTester();
  tester.run().catch(error => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

export default FlowIntegrationTester;
