// Simple test script to examine the Story Protocol SDK exports
const { execSync } = require("child_process");

try {
  // Compile the TypeScript file
  console.log("Compiling SDK test file...");
  execSync("npx tsc --outDir ./dist src/lib/story/sdk-test.ts", {
    stdio: "inherit",
  });

  // Create a simple script to import and run our test
  console.log("\nRunning SDK test...");
  const testScript = `
  const { default: getSDKInfo } = require('./dist/lib/story/sdk-test.js');
  
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
  require("fs").writeFileSync("./sdk-test-runner.js", testScript);

  // Execute the test script
  execSync("node ./sdk-test-runner.js", {
    stdio: "inherit",
  });

  // Clean up
  console.log("\nCleaning up...");
  execSync("rm -f ./sdk-test-runner.js", { stdio: "inherit" });
} catch (error) {
  console.error("Error running SDK test:", error);
}
