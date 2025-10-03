#!/usr/bin/env node

/**
 * Secure Build Script
 * 
 * This script ensures that sensitive environment variables are not
 * included in the production build by explicitly removing them
 * before running the build process.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables that should NEVER be included in client builds
const SENSITIVE_ENV_VARS = [
  'VITE_REVENUECAT_ANDROID_KEY',
  'VITE_REVENUECAT_IOS_KEY',
  'REVENUECAT_ANDROID_KEY',
  'REVENUECAT_IOS_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_AI_API_KEY',
];

function cleanEnvironment() {
  console.log('🔒 Cleaning sensitive environment variables...');
  
  let removedCount = 0;
  for (const envVar of SENSITIVE_ENV_VARS) {
    if (process.env[envVar]) {
      console.log(`   ❌ Removing ${envVar} from build environment`);
      delete process.env[envVar];
      removedCount++;
    }
  }
  
  if (removedCount === 0) {
    console.log('   ✅ No sensitive environment variables found');
  } else {
    console.log(`   🛡️  Removed ${removedCount} sensitive environment variables`);
  }
}

function runBuild() {
  console.log('🏗️  Starting secure build process...');
  
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Secure build completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Build failed with exit code:', code);
      process.exit(code);
    }
  });
  
  buildProcess.on('error', (error) => {
    console.error('❌ Build process error:', error);
    process.exit(1);
  });
}

function main() {
  console.log('🔐 Starting secure build process...\n');
  
  // Clean sensitive environment variables
  cleanEnvironment();
  
  console.log('');
  
  // Run the build
  runBuild();
}

// Run the secure build
main();
