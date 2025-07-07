// This is a shim file to fix the Long import issues in TensorFlow.js
// Re-export Long module with both named and default exports

import * as Long from "long";

// Re-export as both named and default exports
export { Long };

// Default export for compatibility
export default Long.default || Long;
