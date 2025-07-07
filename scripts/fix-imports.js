#!/usr/bin/env node

/**
 * Fix Imports Script
 *
 * This script scans all TypeScript and React files to fix path alias issues
 * that can cause build errors in production.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const SRC_DIR = path.resolve(__dirname, "../src");
const FILE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const PROBLEMATIC_IMPORTS = [
  { pattern: /from ["']@\/components/g, replacement: 'from "../components' },
  { pattern: /from ["']@\/hooks/g, replacement: 'from "../hooks' },
  { pattern: /from ["']@\/lib/g, replacement: 'from "../lib' },
  {
    pattern: /from ["']@\/integrations/g,
    replacement: 'from "../integrations',
  },
  { pattern: /from ["']@\/utils/g, replacement: 'from "../utils' },
  { pattern: /from ["']@\/providers/g, replacement: 'from "../providers' },
  { pattern: /from ["']@\/pages/g, replacement: 'from "../pages' },
  { pattern: /from ["']@\/types/g, replacement: 'from "../types' },
  { pattern: /from ["']components\//g, replacement: 'from "../components/' },
  { pattern: /from ["']@\//g, replacement: 'from "../' },
];

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

console.log(`${colors.blue}=== Import Path Fixer ===${colors.reset}\n`);

// Find all TypeScript and React files
function findFiles(dir, results = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, results);
    } else if (FILE_EXTENSIONS.includes(path.extname(filePath))) {
      results.push(filePath);
    }
  }

  return results;
}

// Fix imports in a file
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;
  let hasChanges = false;

  // Fix problematic imports
  for (const { pattern, replacement } of PROBLEMATIC_IMPORTS) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      hasChanges = true;
    }
    // Reset the lastIndex property to ensure regex works for global patterns
    pattern.lastIndex = 0;
  }

  // Save changes if any
  if (hasChanges) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(
      `${colors.green}Fixed imports in ${colors.cyan}${path.relative(
        SRC_DIR,
        filePath
      )}${colors.reset}`
    );
    return true;
  }

  return false;
}

try {
  console.log(`${colors.blue}Scanning files in ${SRC_DIR}...${colors.reset}`);
  const files = findFiles(SRC_DIR);
  console.log(
    `${colors.cyan}Found ${files.length} files to check${colors.reset}`
  );

  let fixedFilesCount = 0;

  for (const file of files) {
    if (fixImportsInFile(file)) {
      fixedFilesCount++;
    }
  }

  console.log(
    `\n${colors.green}✓ Done! Fixed imports in ${fixedFilesCount} files${colors.reset}`
  );

  if (fixedFilesCount > 0) {
    console.log(
      `\n${colors.yellow}You should rebuild your project now:${colors.reset}`
    );
    console.log(`npm run build`);
  } else {
    console.log(
      `\n${colors.green}No problematic imports found!${colors.reset}`
    );
  }
} catch (error) {
  console.error(`\n${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
}
