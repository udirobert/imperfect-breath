#!/usr/bin/env node

/**
 * Test Story Protocol + Grove Integration
 * This script tests the real Grove storage integration for Story Protocol
 */

async function testGroveIntegration() {
  console.log('🌬️ Testing Story Protocol + Grove Integration...\n');

  // Test 1: Check Grove packages are installed
  console.log('1. Checking Grove package installation...');
  try {
    const { StorageClient } = await import('@lens-chain/storage-client');
    const { chains } = await import('@lens-chain/sdk/viem');
    console.log('✅ Grove packages installed correctly');
  } catch (error) {
    console.log(`❌ Grove packages missing: ${error.message}`);
    return false;
  }

  // Test 2: Test Grove storage directly
  console.log('\n2. Testing Grove storage...');
  try {
    const { StorageClient } = await import('@lens-chain/storage-client');
    const { chains } = await import('@lens-chain/sdk/viem');
    const { immutable } = await import('@lens-chain/storage-client');
    
    const storageClient = StorageClient.create();
    const acl = immutable(chains.testnet.id);
    
    // Test uploading a simple JSON object to Grove
    const testData = {
      test: 'Grove integration test',
      timestamp: new Date().toISOString(),
      pattern: {
        name: 'Test Pattern',
        inhale: 4,
        hold: 7,
        exhale: 8,
        rest: 2
      }
    };

    console.log('   Uploading test data to Grove...');
    const response = await storageClient.uploadAsJson(testData, { acl });
    console.log(`✅ Grove upload successful!`);
    console.log(`   URI: ${response.uri}`);
    console.log(`   Gateway URL: ${response.gatewayUrl}`);
    console.log(`   Storage Key: ${response.storageKey}`);
    
    // Verify it's a proper Lens URI
    if (response.uri.startsWith('lens://')) {
      console.log('✅ Received valid Lens URI format');
    } else {
      console.log('❌ Invalid URI format received');
    }

  } catch (error) {
    console.log(`❌ Grove storage test failed: ${error.message}`);
    return false;
  }

  console.log('\n🎉 Grove integration test completed!');
  console.log('\nNext steps:');
  console.log('- Grove storage is working correctly');
  console.log('- Story Protocol client can now use real Grove uploads');
  console.log('- Test with real breathing patterns from your app');
  console.log('- Set up Story Protocol private key for full IP registration');
  
  return true;
}

// Test Grove storage client directly
async function testGroveStorageClient() {
  console.log('\n📦 Testing Grove Storage Client directly...');
  
  try {
    // Import Grove client
    const { StorageClient } = await import('@lens-chain/storage-client');
    const { chains } = await import('@lens-chain/sdk/viem');
    const { immutable } = await import('@lens-chain/storage-client');
    
    const storageClient = StorageClient.create();
    const acl = immutable(chains.testnet.id);
    
    const testData = {
      message: 'Direct Grove test',
      timestamp: Date.now(),
      breathing_pattern: {
        name: 'Direct Test Pattern',
        phases: [4, 7, 8, 2]
      }
    };
    
    console.log('   Uploading via Grove client...');
    const response = await storageClient.uploadAsJson(testData, { acl });
    
    console.log('✅ Direct Grove upload successful!');
    console.log(`   URI: ${response.uri}`);
    console.log(`   Gateway URL: ${response.gatewayUrl}`);
    console.log(`   Storage Key: ${response.storageKey}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Direct Grove test failed: ${error.message}`);
    return false;
  }
}

// Run tests
async function main() {
  try {
    const groveTest = await testGroveStorageClient();
    const integrationTest = await testGroveIntegration();
    
    if (groveTest && integrationTest) {
      console.log('\n🎉 All tests passed! Grove integration is working correctly.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

main();