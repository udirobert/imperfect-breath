// Simple test script to examine the Story Protocol SDK exports
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Compile the TypeScript file
  console.log("Compiling SDK test file...");
  execSync("npx tsc --outDir ./dist src/lib/story/sdk-test.ts", {
    stdio: "inherit",
  });

  // Create a simple script to import and run our test
  console.log("\nRunning SDK test...");
  const testScript = `
  // ES Module test script
  import { default as getSDKInfo } from './dist/lib/story/sdk-test.js';
  
  console.log('===== STORY PROTOCOL SDK INSPECTION =====');
  const info = getSDKInfo();
  console.log('\\nExported members:', info.exports);
  console.log('\\nExported methods:');
  info.methods
    .filter(m => m.type === 'function' || m.type === 'object')
    .forEach(m => {
      console.log(\`- \${m.name} (\${m.type})\`);
    });
  console.log('\\n=======================================');
  `;

  // Write the test script to a temporary file
  writeFileSync("./sdk-test-runner.mjs", testScript);

  // Execute the test script
  execSync("node ./sdk-test-runner.mjs", {
    stdio: "inherit",
  });

  // Clean up
  console.log("\nCleaning up...");
  execSync("rm -f ./sdk-test-runner.mjs", { stdio: "inherit" });
} catch (error) {
  console.error("Error running SDK test:", error);
}
