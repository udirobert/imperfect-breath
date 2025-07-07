#!/usr/bin/env node

/**
 * Production Debugging Script
 *
 * This script analyzes the production build and checks for common issues
 * that could cause runtime errors like React initialization problems or
 * wallet provider conflicts.
 *
 * Usage: node scripts/debug-production.js
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DIST_DIR = path.resolve(__dirname, "../dist");
const MAIN_CHUNK_PATTERN = /index(-[a-z0-9]+)?\.js$/;
const REACT_MODULES = ["react", "react-dom", "react-jsx-runtime"];

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

console.log(
  `${colors.blue}=== Production Build Diagnostic Tool ===${colors.reset}\n`
);

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error(
    `${colors.red}Error: 'dist' directory not found.${colors.reset}`
  );
  console.log("Please run a production build first with: npm run build");
  process.exit(1);
}

// Get all JS files in dist
const jsFiles = fs
  .readdirSync(DIST_DIR)
  .filter((file) => file.endsWith(".js"))
  .map((file) => path.join(DIST_DIR, file));

console.log(
  `${colors.cyan}Found ${jsFiles.length} JavaScript files in build${colors.reset}`
);

// Find the main chunk
const mainChunkFile = jsFiles.find((file) =>
  MAIN_CHUNK_PATTERN.test(path.basename(file))
);
if (!mainChunkFile) {
  console.error(
    `${colors.red}Error: Could not identify main JavaScript chunk${colors.reset}`
  );
  process.exit(1);
}

console.log(
  `${colors.green}Main chunk identified: ${path.basename(mainChunkFile)}${
    colors.reset
  }`
);

// Check for React references
function checkReactReferences() {
  console.log(`\n${colors.blue}Checking React references...${colors.reset}`);
  const mainChunkContent = fs.readFileSync(mainChunkFile, "utf8");

  const reactPatterns = {
    ReactCurrentOwner: /ReactCurrentOwner/g,
    createRoot: /createRoot/g,
    "React.createElement": /React\.createElement/g,
    "React.Component": /React\.Component/g,
    "React.__SECRET_INTERNALS": /React\.__SECRET_INTERNALS/g,
  };

  let totalIssues = 0;

  Object.entries(reactPatterns).forEach(([name, pattern]) => {
    const matches = (mainChunkContent.match(pattern) || []).length;
    if (matches === 0) {
      console.log(
        `${colors.yellow}Warning: No references to ${name} found${colors.reset}`
      );
      totalIssues++;
    } else {
      console.log(
        `${colors.green}✓ Found ${matches} references to ${name}${colors.reset}`
      );
    }
  });

  if (totalIssues === 0) {
    console.log(
      `${colors.green}All React references check out!${colors.reset}`
    );
  } else {
    console.log(
      `${colors.yellow}Found ${totalIssues} potential issues with React references${colors.reset}`
    );
  }
}

// Check for wallet provider code
function checkWalletProviders() {
  console.log(
    `\n${colors.blue}Checking wallet provider handling...${colors.reset}`
  );
  const mainChunkContent = fs.readFileSync(mainChunkFile, "utf8");

  const walletPatterns = {
    "window.ethereum": /window\.ethereum/g,
    "ethereum proxy": /new\s+Proxy/g,
    "Wallet detection": /Wallet\s+provider\s+detected/g,
  };

  let totalIssues = 0;

  Object.entries(walletPatterns).forEach(([name, pattern]) => {
    const matches = (mainChunkContent.match(pattern) || []).length;
    if (matches === 0) {
      console.log(
        `${colors.yellow}Warning: No references to ${name} found${colors.reset}`
      );
      totalIssues++;
    } else {
      console.log(
        `${colors.green}✓ Found ${matches} references to ${name}${colors.reset}`
      );
    }
  });

  if (totalIssues === 0) {
    console.log(
      `${colors.green}Wallet provider handling looks good!${colors.reset}`
    );
  } else {
    console.log(
      `${colors.yellow}Found ${totalIssues} potential issues with wallet provider handling${colors.reset}`
    );
  }
}

// Check bundle size
function checkBundleSize() {
  console.log(`\n${colors.blue}Analyzing bundle sizes...${colors.reset}`);

  const fileSizes = jsFiles
    .map((file) => {
      const stats = fs.statSync(file);
      const sizeInKB = stats.size / 1024;
      return {
        file: path.basename(file),
        size: sizeInKB,
        sizeFormatted: `${sizeInKB.toFixed(2)} KB`,
      };
    })
    .sort((a, b) => b.size - a.size);

  console.log(`${colors.cyan}Top 5 largest chunks:${colors.reset}`);
  fileSizes.slice(0, 5).forEach((file, index) => {
    console.log(`${index + 1}. ${file.file}: ${file.sizeFormatted}`);
  });

  const totalSize = fileSizes.reduce((acc, file) => acc + file.size, 0);
  console.log(
    `\n${colors.cyan}Total JavaScript size: ${totalSize.toFixed(2)} KB${
      colors.reset
    }`
  );

  if (totalSize > 2000) {
    console.log(
      `${colors.yellow}Warning: Bundle size is quite large (> 2MB). Consider code splitting or lazy loading.${colors.reset}`
    );
  }
}

// Provide recommendations
function provideRecommendations() {
  console.log(`\n${colors.blue}=== Recommendations ===${colors.reset}`);

  console.log(
    `${colors.cyan}1. Test with different wallet providers${colors.reset}`
  );
  console.log(
    "   Try disabling browser extensions one by one to identify conflicts"
  );

  console.log(
    `\n${colors.cyan}2. Check browser console for errors${colors.reset}`
  );
  console.log(
    "   Look for specific error messages about React initialization or wallet providers"
  );

  console.log(
    `\n${colors.cyan}3. Try this fix for wallet conflicts:${colors.reset}`
  );
  console.log("   Add to index.html before any scripts:");
  console.log(`   ${colors.yellow}<script>
     // Preserve original ethereum provider
     window.__originalEthereum = window.ethereum;
   </script>${colors.reset}`);

  console.log(
    `\n${colors.cyan}4. For React initialization errors:${colors.reset}`
  );
  console.log(
    "   Make sure React is properly loaded before any component rendering"
  );
  console.log("   Consider removing React.StrictMode in production");

  console.log(`\n${colors.cyan}5. For large bundle sizes:${colors.reset}`);
  console.log("   Consider implementing code splitting with dynamic imports");
  console.log(
    "   Configure manualChunks in vite.config.ts to better split vendor code"
  );
}

// Run all checks
function runAllChecks() {
  checkReactReferences();
  checkWalletProviders();
  checkBundleSize();
  provideRecommendations();
}

// Execute
try {
  runAllChecks();
  console.log(`\n${colors.green}All checks completed!${colors.reset}`);
} catch (error) {
  console.error(`\n${colors.red}Error during checks:${colors.reset}`, error);
  process.exit(1);
}
