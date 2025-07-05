// Directly import the SDK
import * as StorySDK from "@story-protocol/core-sdk";

// Log all available exports
console.log("===== STORY PROTOCOL SDK INSPECTION =====");
console.log("\nSDK Exports:", Object.keys(StorySDK));

// Inspect each export
Object.keys(StorySDK).forEach((key) => {
  const item = StorySDK[key];
  const type = typeof item;
  console.log(`\n${key} (${type}):`);

  if (type === "function") {
    // If it's a constructor
    if (key[0] === key[0].toUpperCase()) {
      console.log("- Constructor properties:", Object.keys(item));
      console.log(
        "- Prototype methods:",
        Object.getOwnPropertyNames(item.prototype || {}).filter(
          (m) => m !== "constructor"
        )
      );
    } else {
      // Regular function
      console.log("- Function");
    }
  } else if (type === "object" && item !== null) {
    // Check if it's a class or object
    console.log("- Properties:", Object.keys(item));

    // If it has methods, list them
    const methods = Object.keys(item).filter(
      (k) => typeof item[k] === "function"
    );
    if (methods.length > 0) {
      console.log("- Methods:", methods);
    }
  }
});

console.log("\n=======================================");
