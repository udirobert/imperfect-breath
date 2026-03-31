#!/usr/bin/env node

/**
 * Build Secrets Security Check
 * 
 * This script scans the build output to ensure no sensitive information
 * like API keys or secrets are exposed in the client-side bundle.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns to search for (potential secrets)
const SECRET_PATTERNS = [
  // RevenueCat keys
  /appl_[A-Za-z0-9]{20,}/g,
  /goog_[A-Za-z0-9]{20,}/g,
  
  // API keys
  /sk-[A-Za-z0-9]{20,}/g,  // OpenAI
  /AIza[A-Za-z0-9]{35}/g,  // Google API
  /pk_[a-z]+_[A-Za-z0-9]{20,}/g,  // Stripe
  
  // Generic patterns
  /[A-Za-z0-9]{32,}/g,  // Long alphanumeric strings (potential keys)
];

// Allowed patterns (false positives)
const ALLOWED_PATTERNS = [
  /appl_dev_fallback_key/,
  /goog_dev_fallback_key/,
  /appl_mock_key_for_testing/,
  /goog_mock_key_for_testing/,
  /appl_your_ios_key_here/,
  /goog_your_android_key_here/,
  /appl_YOUR_IOS_KEY_HERE/,
  /goog_YOUR_ANDROID_KEY_HERE/,
  // Common false positives from libraries
  /pageBorderBoxWithDroppableScroll/,
  /disableInteractiveElementBlocking/,
  /isWalletCompatibleWithCurrentChain/,
  /OffchainLookupResponseMalformedError/,
  /OffchainLookupSenderMismatchError/,
  /removeAddressFromNativeBalanceCache/,
  /getNativeBalanceCacheForCaipAddress/,
  /setUniversalProviderConfigOverride/,
  /getUniversalProviderConfigOverride/,
  /updateConnectorsForEnabledNamespaces/,
  /typeddatainvalidprimarytypeerror/,
  // Ethereum addresses and common crypto patterns
  /0x[a-fA-F0-9]{40}/,
  /0x[a-fA-F0-9]{64}/,
  // Solana addresses
  /So11111111111111111111111111111111111111111/,
  // Mathematical constants
  /302585092994045684017991454684364207601101488628772976033327900967572609677352480235997205089598298341967784042286/,
  // Unicode ranges
  /u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260/,
  // Wallet IDs
  /a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393/,
  /1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79/,
  /fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa/,
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  
  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Check if this match is in our allowed list
        const isAllowed = ALLOWED_PATTERNS.some(allowedPattern => 
          allowedPattern.test(match)
        );
        
        if (!isAllowed) {
          findings.push({
            file: filePath,
            pattern: pattern.toString(),
            match: match,
            context: getContext(content, match)
          });
        }
      }
    }
  }
  
  return findings;
}

function getContext(content, match) {
  const index = content.indexOf(match);
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + match.length + 50);
  return content.substring(start, end);
}

function scanDirectory(dirPath) {
  const findings = [];
  
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Build directory not found: ${dirPath}`);
    console.log('   Run "npm run build" first to generate the build output.');
    return findings;
  }
  
  function scanRecursive(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        scanRecursive(itemPath);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.css') || item.endsWith('.html'))) {
        const fileFindings = scanFile(itemPath);
        findings.push(...fileFindings);
      }
    }
  }
  
  scanRecursive(dirPath);
  return findings;
}

function main() {
  console.log('🔍 Scanning build output for exposed secrets...\n');
  
  const buildDir = path.join(__dirname, '..', 'dist');
  const findings = scanDirectory(buildDir);
  
  if (findings.length === 0) {
    console.log('✅ No secrets found in build output!');
    console.log('   Your build is secure and ready for deployment.\n');
    process.exit(0);
  } else {
    console.log('❌ Potential secrets found in build output:\n');
    
    for (const finding of findings) {
      console.log(`📁 File: ${path.relative(buildDir, finding.file)}`);
      console.log(`🔍 Pattern: ${finding.pattern}`);
      console.log(`🚨 Match: ${finding.match}`);
      console.log(`📝 Context: ...${finding.context}...`);
      console.log('');
    }
    
    console.log('🛡️  Security recommendations:');
    console.log('   1. Remove sensitive keys from client-side code');
    console.log('   2. Use server-side endpoints for sensitive operations');
    console.log('   3. Configure SECRETS_SCAN_OMIT_KEYS in netlify.toml if these are public keys');
    console.log('   4. Verify that exposed values are not actual secrets\n');
    
    process.exit(1);
  }
}

// Run the security check
main();
