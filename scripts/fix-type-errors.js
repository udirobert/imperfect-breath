#!/usr/bin/env node

/**
 * TypeScript Error Fixer
 *
 * This script scans the codebase for common TypeScript errors after
 * the Lens V3 migration and fixes them automatically.
 *
 * It primarily addresses:
 * 1. Import path errors (@/ vs ../ style imports)
 * 2. Missing type definitions
 * 3. Path mapping issues
 *
 * @version 1.0.0
 * @updated 2025-05-07
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// Configuration
const config = {
  // Files with known import errors
  filesToFix: [
    "src/utils/blockchain-verifier.ts",
    "src/lib/revenue/revenueManager.ts",
  ],
  // Path mappings to correct
  pathMappings: {
    "@/hooks/": "../hooks/",
    "@/lib/": "../lib/",
    "@/types/": "../types/",
    "@/utils/": "../utils/",
    "@/config/": "../config/",
  },
  // Import substitutions
  importSubstitutions: {
    "../types/blockchain": "../types/network",
    "../lib/blockchain/config": "../config/environment",
  },
};

/**
 * Fixes import paths in a file
 */
function fixImportPaths(filePath) {
  console.log(`${colors.blue}Fixing imports in:${colors.reset} ${filePath}`);

  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;
  let changes = 0;

  // Fix path mappings
  for (const [fromPath, toPath] of Object.entries(config.pathMappings)) {
    const importRegex = new RegExp(
      `import\\s+(.+?)\\s+from\\s+['"]${fromPath.replace("/", "\\/")}(.+?)['"]`,
      "g"
    );
    content = content.replace(importRegex, (match, importWhat, importPath) => {
      changes++;
      return `import ${importWhat} from '${toPath}${importPath}'`;
    });
  }

  // Fix specific import substitutions
  for (const [fromImport, toImport] of Object.entries(
    config.importSubstitutions
  )) {
    const importRegex = new RegExp(
      `import\\s+(.+?)\\s+from\\s+['"]${fromImport.replace("/", "\\/")}['"]`,
      "g"
    );
    content = content.replace(importRegex, (match, importWhat) => {
      changes++;
      return `import ${importWhat} from '${toImport}'`;
    });
  }

  // Write changes back to file if needed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(
      `${colors.green}✓ Fixed ${changes} import issues in:${colors.reset} ${filePath}`
    );
    return true;
  } else {
    console.log(
      `${colors.yellow}No import issues found in:${colors.reset} ${filePath}`
    );
    return false;
  }
}

/**
 * Updates tsconfig.json to ensure proper path mapping
 */
function updateTsConfig() {
  const tsconfigPath = path.join(process.cwd(), "tsconfig.json");

  if (!fs.existsSync(tsconfigPath)) {
    console.log(`${colors.red}Error: tsconfig.json not found${colors.reset}`);
    return false;
  }

  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));

    // Ensure paths are properly configured
    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
    }

    if (!tsconfig.compilerOptions.paths) {
      tsconfig.compilerOptions.paths = {};
    }

    // Add or update path mappings
    tsconfig.compilerOptions.paths = {
      ...tsconfig.compilerOptions.paths,
      "@/*": ["./src/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@lib/*": ["./src/lib/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"],
      "@config/*": ["./src/config/*"],
      "@components/*": ["./src/components/*"],
    };

    // Write updated tsconfig
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), "utf8");
    console.log(
      `${colors.green}✓ Updated path mappings in tsconfig.json${colors.reset}`
    );
    return true;
  } catch (error) {
    console.log(
      `${colors.red}Error updating tsconfig.json: ${error.message}${colors.reset}`
    );
    return false;
  }
}

/**
 * Creates missing type definition files
 */
function createMissingTypeDefinitions() {
  // Ensure blockchain.ts has proper import from network.ts
  const blockchainTypesPath = path.join(
    process.cwd(),
    "src/types/blockchain.ts"
  );

  if (!fs.existsSync(blockchainTypesPath)) {
    console.log(
      `${colors.yellow}Creating blockchain.ts type definition file...${colors.reset}`
    );

    const content = `/**
 * Type re-exports for backward compatibility
 * @deprecated Use network.ts directly
 */

export * from './network';
`;

    fs.writeFileSync(blockchainTypesPath, content, "utf8");
    console.log(
      `${colors.green}✓ Created blockchain.ts type re-export file${colors.reset}`
    );
  } else {
    const content = fs.readFileSync(blockchainTypesPath, "utf8");

    if (!content.includes("export * from './network'")) {
      // Add the re-export if it doesn't exist
      const newContent =
        content +
        `\n\n// Re-export network types for compatibility\nexport * from './network';\n`;
      fs.writeFileSync(blockchainTypesPath, newContent, "utf8");
      console.log(
        `${colors.green}✓ Updated blockchain.ts with network type exports${colors.reset}`
      );
    }
  }

  return true;
}

/**
 * Main function
 */
async function main() {
  console.log(`\n${colors.cyan}=== TypeScript Error Fixer ====${colors.reset}`);
  console.log(
    `${colors.gray}Fixing common TypeScript errors after Lens V3 migration${colors.reset}\n`
  );

  let fixedFiles = 0;

  // Fix specific files with known issues
  for (const file of config.filesToFix) {
    const filePath = path.join(process.cwd(), file);

    if (fs.existsSync(filePath)) {
      const fixed = fixImportPaths(filePath);
      if (fixed) fixedFiles++;
    } else {
      console.log(
        `${colors.yellow}Warning: File not found:${colors.reset} ${file}`
      );
    }
  }

  // Update tsconfig.json
  updateTsConfig();

  // Create missing type definitions
  createMissingTypeDefinitions();

  // Run the TypeScript compiler to check for remaining errors
  try {
    console.log(
      `\n${colors.blue}Running TypeScript compiler to check for remaining errors...${colors.reset}`
    );
    execSync("npx tsc --noEmit", { stdio: "inherit" });
    console.log(
      `\n${colors.green}✓ All TypeScript errors fixed!${colors.reset}`
    );
  } catch (error) {
    console.log(
      `\n${colors.yellow}Some TypeScript errors still remain.${colors.reset}`
    );
    console.log(
      `${colors.gray}You may need to fix these manually.${colors.reset}`
    );
  }

  console.log(`\n${colors.green}Summary:${colors.reset}`);
  console.log(`- Fixed imports in ${fixedFiles} files`);
  console.log(`- Updated TypeScript configuration`);
  console.log(`- Created/updated type definition files`);
  console.log(`\n${colors.cyan}Done!${colors.reset}`);
}

main().catch((error) => {
  console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
  process.exit(1);
});
