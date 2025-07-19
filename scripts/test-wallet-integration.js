#!/usr/bin/env node

/**
 * Wallet Integration Diagnostic Script
 * Tests ConnectKit and Web3 provider setup
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');

console.log('🔍 Wallet Integration Diagnostic');
console.log('================================\n');

// Test 1: Check required dependencies
console.log('📦 Checking Dependencies...');
const packageJson = JSON.parse(fs.readFileSync(join(projectRoot, 'package.json'), 'utf8'));

const requiredDeps = {
  'connectkit': 'ConnectKit wallet integration',
  'wagmi': 'Web3 React hooks',
  'viem': 'Ethereum library',
  '@tanstack/react-query': 'Async state management',
  '@wagmi/core': 'Wagmi core functionality',
  '@wagmi/connectors': 'Wallet connectors'
};

let depsInstalled = 0;
Object.entries(requiredDeps).forEach(([dep, description]) => {
  const isInstalled = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
  console.log(`  ${isInstalled ? '✅' : '❌'} ${dep} - ${description}`);
  if (isInstalled) {
    console.log(`     Version: ${isInstalled}`);
    depsInstalled++;
  }
});

console.log(`\n📊 Dependencies Status: ${depsInstalled}/${Object.keys(requiredDeps).length} installed\n`);

// Test 2: Check environment variables
console.log('🔧 Checking Environment Configuration...');

const envFiles = ['.env', '.env.local', '.env.development'];
let envFound = false;

envFiles.forEach(envFile => {
  const envPath = join(projectRoot, envFile);
  if (fs.existsSync(envPath)) {
    console.log(`  ✅ Found ${envFile}`);
    envFound = true;

    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredEnvVars = [
      'VITE_WALLETCONNECT_PROJECT_ID',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_GEMINI_API_KEY'
    ];

    requiredEnvVars.forEach(varName => {
      const hasVar = envContent.includes(varName) && !envContent.includes(`${varName}=your_`);
      console.log(`     ${hasVar ? '✅' : '⚠️ '} ${varName}`);
    });
  }
});

if (!envFound) {
  console.log('  ❌ No environment files found');
  console.log('  💡 Create .env.local with required variables');
}

console.log('');

// Test 3: Check file structure
console.log('📁 Checking File Structure...');

const requiredFiles = [
  'src/providers/EnhancedWeb3Provider.tsx',
  'src/components/wallet/ConnectWalletButton.tsx',
  'src/hooks/useAuth.ts',
  'src/pages/WalletTestPage.tsx'
];

requiredFiles.forEach(filePath => {
  const fullPath = join(projectRoot, filePath);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${filePath}`);
});

console.log('');

// Test 4: Check imports and exports
console.log('🔗 Checking Key Integrations...');

try {
  // Check if main.tsx uses EnhancedWeb3Provider
  const mainTsxPath = join(projectRoot, 'src/main.tsx');
  if (fs.existsSync(mainTsxPath)) {
    const mainContent = fs.readFileSync(mainTsxPath, 'utf8');
    const hasEnhancedProvider = mainContent.includes('EnhancedWeb3Provider');
    console.log(`  ${hasEnhancedProvider ? '✅' : '❌'} EnhancedWeb3Provider integrated in main.tsx`);
  }

  // Check if useAuth enables blockchain features
  const useAuthPath = join(projectRoot, 'src/hooks/useAuth.ts');
  if (fs.existsSync(useAuthPath)) {
    const authContent = fs.readFileSync(useAuthPath, 'utf8');
    const blockchainEnabled = authContent.includes('BLOCKCHAIN_FEATURES_ENABLED = true');
    console.log(`  ${blockchainEnabled ? '✅' : '❌'} Blockchain features enabled in useAuth`);
  }

  // Check if App.tsx includes wallet test route
  const appTsxPath = join(projectRoot, 'src/App.tsx');
  if (fs.existsSync(appTsxPath)) {
    const appContent = fs.readFileSync(appTsxPath, 'utf8');
    const hasWalletTest = appContent.includes('/wallet-test');
    console.log(`  ${hasWalletTest ? '✅' : '⚠️ '} Wallet test page route added`);
  }

} catch (error) {
  console.log(`  ❌ Error checking integrations: ${error.message}`);
}

console.log('');

// Test 5: Check for potential issues
console.log('⚠️  Potential Issues Check...');

try {
  const viteConfigPath = join(projectRoot, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
    const hasMediaPipeExternals = viteContent.includes('@mediapipe');
    console.log(`  ${hasMediaPipeExternals ? '✅' : '⚠️ '} MediaPipe externals configured`);
  }

  // Check for conflicting dependencies
  const hasOldWagmi = packageJson.dependencies?.['wagmi']?.startsWith('1.');
  console.log(`  ${!hasOldWagmi ? '✅' : '❌'} Wagmi v2+ (no v1.x conflicts)`);

  // Check for ConnectKit peer dependency issues
  const nodeModulesPath = join(projectRoot, 'node_modules/connectkit');
  const connectKitInstalled = fs.existsSync(nodeModulesPath);
  console.log(`  ${connectKitInstalled ? '✅' : '❌'} ConnectKit properly installed`);

} catch (error) {
  console.log(`  ❌ Error checking for issues: ${error.message}`);
}

console.log('');

// Test 6: Browser compatibility
console.log('🌐 Browser Compatibility Notes...');
console.log('  ✅ Modern browsers with ES2020 support');
console.log('  ✅ MetaMask, WalletConnect, Coinbase Wallet');
console.log('  ✅ Mobile wallet apps via WalletConnect');
console.log('  ⚠️  Internet Explorer not supported');

console.log('');

// Summary and next steps
console.log('📋 Next Steps...');

if (depsInstalled === Object.keys(requiredDeps).length) {
  console.log('  1. ✅ All dependencies installed');
} else {
  console.log('  1. ❌ Install missing dependencies with: npm install connectkit');
}

if (envFound) {
  console.log('  2. ✅ Environment configuration found');
} else {
  console.log('  2. ❌ Create .env.local with API keys');
  console.log('     • Get WalletConnect Project ID: https://cloud.walletconnect.com/');
  console.log('     • Get Alchemy API Key: https://dashboard.alchemy.com/');
  console.log('     • Get Gemini API Key: https://makersuite.google.com/app/apikey');
}

console.log('  3. 🚀 Start development server: npm run dev');
console.log('  4. 🧪 Test wallet integration: http://localhost:3000/wallet-test');

console.log('\n🎉 Integration diagnostic complete!');

// Exit with appropriate code
const allGood = depsInstalled === Object.keys(requiredDeps).length && envFound;
process.exit(allGood ? 0 : 1);
