#!/usr/bin/env node

/**
 * Wallet Setup Verification Script
 * Quick verification that ConnectKit and Web3 integration is working
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');

console.log('🔍 Quick Wallet Setup Verification');
console.log('==================================\n');

let allChecks = 0;
let passedChecks = 0;

function check(description, condition) {
  allChecks++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (condition) passedChecks++;
  return condition;
}

// 1. Core dependencies
console.log('📦 Core Dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync(join(projectRoot, 'package.json'), 'utf8'));

  check('ConnectKit installed', !!packageJson.dependencies?.['connectkit']);
  check('Wagmi v2+ installed', packageJson.dependencies?.['wagmi']?.includes('2.'));
  check('Viem v2+ installed', packageJson.dependencies?.['viem']?.includes('2.'));
  check('TanStack Query installed', !!packageJson.dependencies?.['@tanstack/react-query']);
} catch (error) {
  check('Package.json readable', false);
}

console.log('');

// 2. File structure
console.log('📁 File Structure:');
const criticalFiles = [
  ['Enhanced Web3 Provider', 'src/providers/EnhancedWeb3Provider.tsx'],
  ['Connect Wallet Button', 'src/components/wallet/ConnectWalletButton.tsx'],
  ['Enhanced useAuth hook', 'src/hooks/useAuth.ts'],
  ['Wallet Test Page', 'src/pages/WalletTestPage.tsx']
];

criticalFiles.forEach(([name, path]) => {
  check(name, fs.existsSync(join(projectRoot, path)));
});

console.log('');

// 3. Configuration checks
console.log('⚙️  Configuration:');
try {
  // Check main.tsx integration
  const mainContent = fs.readFileSync(join(projectRoot, 'src/main.tsx'), 'utf8');
  check('EnhancedWeb3Provider in main.tsx', mainContent.includes('EnhancedWeb3Provider'));

  // Check useAuth blockchain features
  const authContent = fs.readFileSync(join(projectRoot, 'src/hooks/useAuth.ts'), 'utf8');
  check('Blockchain features enabled', authContent.includes('BLOCKCHAIN_FEATURES_ENABLED = true'));

  // Check App.tsx routing
  const appContent = fs.readFileSync(join(projectRoot, 'src/App.tsx'), 'utf8');
  check('Wallet test route added', appContent.includes('/wallet-test'));

  // Check vite config
  const viteContent = fs.readFileSync(join(projectRoot, 'vite.config.ts'), 'utf8');
  check('MediaPipe externals configured', viteContent.includes('@mediapipe'));

} catch (error) {
  check('Configuration files readable', false);
}

console.log('');

// 4. Environment setup
console.log('🔧 Environment:');
const envFiles = ['.env', '.env.local', '.env.development'];
let hasEnv = false;

envFiles.forEach(envFile => {
  if (fs.existsSync(join(projectRoot, envFile))) {
    hasEnv = true;
  }
});

check('Environment file exists', hasEnv);

if (hasEnv) {
  // Check for critical env vars in any env file
  let hasWalletConnect = false;
  let hasSupabase = false;

  envFiles.forEach(envFile => {
    const envPath = join(projectRoot, envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      if (content.includes('VITE_WALLETCONNECT_PROJECT_ID') && !content.includes('demo-project-id')) {
        hasWalletConnect = true;
      }
      if (content.includes('VITE_SUPABASE_URL') && !content.includes('your_supabase')) {
        hasSupabase = true;
      }
    }
  });

  check('WalletConnect Project ID configured', hasWalletConnect);
  check('Supabase URL configured', hasSupabase);
}

console.log('');

// 5. Build test
console.log('🏗️  Build Test:');
try {
  const { execSync } = require('child_process');

  // Quick syntax check
  execSync('npx tsc --noEmit --skipLibCheck', {
    cwd: projectRoot,
    stdio: 'ignore',
    timeout: 30000
  });
  check('TypeScript compilation', true);
} catch (error) {
  check('TypeScript compilation', false);
}

console.log('');

// Summary
console.log('📊 Summary:');
console.log(`   Checks passed: ${passedChecks}/${allChecks}`);

if (passedChecks === allChecks) {
  console.log('   🎉 All checks passed! Wallet integration is ready.');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. npm run dev');
  console.log('   2. Open http://localhost:3000/wallet-test');
  console.log('   3. Test wallet connection');
  console.log('');
  process.exit(0);
} else {
  console.log('   ⚠️  Some checks failed. Review the output above.');
  console.log('');
  console.log('🔧 Common fixes:');
  console.log('   • Run: npm install connectkit');
  console.log('   • Create .env.local with API keys');
  console.log('   • Check file paths in src/ directory');
  console.log('');
  process.exit(1);
}
