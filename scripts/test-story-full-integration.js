#!/usr/bin/env node

/**
 * Full Story Protocol Integration Test
 * Tests real IP registration with loaded testnet account
 */

async function testFullStoryIntegration() {
  console.log('🌬️ Testing FULL Story Protocol Integration with Real Account...\n');

  // Get account info first
  const { privateKeyToAccount } = await import('viem/accounts');
  const privateKey = process.env.VITE_STORY_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('VITE_STORY_PRIVATE_KEY environment variable is required');
  }
  const account = privateKeyToAccount(privateKey);

  // Test 1: Test Grove storage
  console.log('1. Testing Grove storage...');
  try {
    const { StorageClient } = await import('@lens-chain/storage-client');
    const { chains } = await import('@lens-chain/sdk/viem');
    const { immutable } = await import('@lens-chain/storage-client');
    
    const storageClient = StorageClient.create();
    const acl = immutable(chains.testnet.id);
    
    const testMetadata = {
      title: 'Test Breathing Pattern for IP Registration',
      description: 'A 4-7-8 breathing pattern designed for stress relief and better sleep',
      creators: [
        {
          name: 'Imperfect Breath Test User',
          address: account.address,
          contributionPercent: 100
        }
      ],
      attributes: [
        { trait_type: 'Inhale Duration', value: '4' },
        { trait_type: 'Hold Duration', value: '7' },
        { trait_type: 'Exhale Duration', value: '8' },
        { trait_type: 'Rest Duration', value: '2' },
        { trait_type: 'Pattern Type', value: 'Breathing Pattern' },
        { trait_type: 'Total Cycle Time', value: '21' }
      ]
    };

    const response = await storageClient.uploadAsJson(testMetadata, { acl });
    console.log('✅ Grove upload successful!');
    console.log(`   URI: ${response.uri}`);
    console.log(`   Gateway: ${response.gatewayUrl}`);

  } catch (error) {
    console.log(`❌ Grove test failed: ${error.message}`);
    return false;
  }

  // Test 2: Test Story Protocol client initialization
  console.log('\n2. Testing Story Protocol client...');
  try {
    const { StoryClient } = await import('@story-protocol/core-sdk');
    const { http } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    
    // Get private key from environment
    const privateKey = process.env.VITE_STORY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('VITE_STORY_PRIVATE_KEY environment variable is required');
    }
    const account = privateKeyToAccount(privateKey);
    
    const storyConfig = {
      account,
      transport: http('https://aeneid.storyrpc.io'),
      chainId: 'aeneid',
    };

    const client = StoryClient.newClient(storyConfig);
    console.log('✅ Story Protocol client initialized');
    console.log(`   Account: ${account.address}`);

  } catch (error) {
    console.log(`❌ Story client initialization failed: ${error.message}`);
    return false;
  }

  // Test 3: Test IP metadata generation
  console.log('\n3. Testing IP metadata generation...');
  try {
    const { StoryClient } = await import('@story-protocol/core-sdk');
    const { http } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    
    const privateKey = process.env.VITE_STORY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('VITE_STORY_PRIVATE_KEY environment variable is required');
    }
    const account = privateKeyToAccount(privateKey);
    
    const storyConfig = {
      account,
      transport: http('https://aeneid.storyrpc.io'),
      chainId: 'aeneid',
    };

    const client = StoryClient.newClient(storyConfig);
    
    // Generate IP metadata for breathing pattern
    const ipMetadata = client.ipAsset.generateIpMetadata({
      title: '4-7-8 Stress Relief Pattern',
      description: 'A scientifically-backed breathing pattern for stress relief and improved sleep quality.',
      creators: [
        {
          name: 'Imperfect Breath Creator',
          address: account.address,
          contributionPercent: 100,
        },
      ],
      // Add breathing pattern specific attributes
      attributes: [
        { trait_type: 'Inhale Duration', value: '4 seconds' },
        { trait_type: 'Hold Duration', value: '7 seconds' },
        { trait_type: 'Exhale Duration', value: '8 seconds' },
        { trait_type: 'Rest Duration', value: '2 seconds' },
        { trait_type: 'Pattern Category', value: 'Stress Relief' },
        { trait_type: 'Difficulty Level', value: 'Beginner' },
        { trait_type: 'Total Cycle Time', value: '21 seconds' }
      ]
    });

    console.log('✅ IP metadata generated successfully');
    console.log(`   Title: ${ipMetadata.title}`);
    console.log(`   Creators: ${ipMetadata.creators.length}`);
    console.log(`   Attributes: ${ipMetadata.attributes?.length || 0}`);

  } catch (error) {
    console.log(`❌ IP metadata generation failed: ${error.message}`);
    return false;
  }

  // Test 4: Test full IP registration (REAL TRANSACTION)
  console.log('\n4. Testing REAL IP registration...');
  console.log('⚠️  This will create a real transaction on Story Protocol testnet!');
  
  try {
    const { StoryClient } = await import('@story-protocol/core-sdk');
    const { http, parseEther, zeroAddress } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    const { StorageClient } = await import('@lens-chain/storage-client');
    const { chains } = await import('@lens-chain/sdk/viem');
    const { immutable } = await import('@lens-chain/storage-client');
    const { createHash } = await import('crypto');
    
    const privateKey = process.env.VITE_STORY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('VITE_STORY_PRIVATE_KEY environment variable is required');
    }
    const account = privateKeyToAccount(privateKey);
    
    const storyConfig = {
      account,
      transport: http('https://aeneid.storyrpc.io'),
      chainId: 'aeneid',
    };

    const client = StoryClient.newClient(storyConfig);
    const storageClient = StorageClient.create();
    const acl = immutable(chains.testnet.id);
    
    // Create IP metadata
    const ipMetadata = client.ipAsset.generateIpMetadata({
      title: 'Imperfect Breath Test Pattern',
      description: 'A test breathing pattern for Story Protocol integration verification.',
      creators: [
        {
          name: 'Imperfect Breath Test',
          address: account.address,
          contributionPercent: 100,
        },
      ],
      attributes: [
        { trait_type: 'Inhale', value: '4' },
        { trait_type: 'Hold', value: '7' },
        { trait_type: 'Exhale', value: '8' },
        { trait_type: 'Rest', value: '2' }
      ]
    });

    // Create NFT metadata
    const nftMetadata = {
      name: 'Imperfect Breath Test Pattern NFT',
      description: 'This NFT represents ownership of the Imperfect Breath Test Pattern.',
      attributes: [
        { trait_type: 'Inhale', value: 4 },
        { trait_type: 'Hold', value: 7 },
        { trait_type: 'Exhale', value: 8 },
        { trait_type: 'Rest', value: 2 }
      ]
    };

    console.log('   Uploading metadata to Grove...');
    const ipResponse = await storageClient.uploadAsJson(ipMetadata, { acl });
    const nftResponse = await storageClient.uploadAsJson(nftMetadata, { acl });
    
    const ipHash = createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex');
    const nftHash = createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex');

    console.log('   Metadata uploaded successfully');
    console.log(`   IP URI: ${ipResponse.uri}`);
    console.log(`   NFT URI: ${nftResponse.uri}`);

    // Create license terms (non-commercial) - correct format
    const licenseTerms = {
      transferable: true,
      royaltyPolicy: zeroAddress,
      defaultMintingFee: 0n,
      expiration: 0n,
      commercialUse: false,
      commercialAttribution: false,
      commercializerChecker: zeroAddress,
      commercializerCheckerData: '0x',
      commercialRevShare: 0,
      commercialRevCeiling: 0n,
      derivativesAllowed: true,
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: true,
      derivativeRevCeiling: 0n,
      currency: zeroAddress,
      uri: 'https://github.com/piplabs/pil-document/blob/998c13e6ee1d04eb817aefd1fe16dfe8be3cd7a2/off-chain-terms/NCSR.json'
    };

    console.log('   Registering IP on Story Protocol...');
    console.log('   (This may take 30-60 seconds for blockchain confirmation)');

    // Register IP with license terms - correct format
    const spgNftContract = '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc'; // Testnet SPG contract
    
    const result = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract,
      licenseTermsData: [
        {
          terms: licenseTerms,
        }
      ],
      ipMetadata: {
        ipMetadataURI: ipResponse.uri,
        ipMetadataHash: `0x${ipHash}`,
        nftMetadataURI: nftResponse.uri,
        nftMetadataHash: `0x${nftHash}`,
      }
    });

    console.log('🎉 IP REGISTRATION SUCCESSFUL!');
    console.log(`   Transaction Hash: ${result.txHash}`);
    console.log(`   IP ID: ${result.ipId}`);
    console.log(`   Token ID: ${result.tokenId}`);
    console.log(`   License Terms ID: ${result.licenseTermsId}`);
    console.log(`   Explorer: https://aeneid.explorer.story.foundation/ipa/${result.ipId}`);
    console.log(`   Blockscout: https://aeneid.storyscan.io/tx/${result.txHash}`);

    return true;

  } catch (error) {
    console.log(`❌ IP registration failed: ${error.message}`);
    console.log('   This might be due to:');
    console.log('   - Insufficient testnet tokens');
    console.log('   - Network connectivity issues');
    console.log('   - RPC rate limiting');
    console.log(`   Full error: ${error.stack}`);
    return false;
  }
}

// Run the test
async function main() {
  try {
    const success = await testFullStoryIntegration();
    
    if (success) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('\n✅ Story Protocol integration is FULLY WORKING!');
      console.log('✅ Real IP registration successful');
      console.log('✅ Grove storage integration working');
      console.log('✅ Ready for production use');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Check the output above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

main();