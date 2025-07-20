/**
 * Batch Transaction Utilities
 *
 * Helper functions for executing batched transactions on Flow blockchain
 */

import * as fcl from "@onflow/fcl";

// Types for batched transactions
export interface EVMBatchCall {
  address: string;
  abi: unknown[];
  functionName: string;
  args?: unknown[];
  value?: bigint;
  gas?: number;
}

export interface CallOutcome {
  hash: string;
  status: "passed" | "failed";
  errorMessage: string;
}

export interface BatchTransactionResult {
  isPending: boolean;
  isError: boolean;
  txId: string;
  results: CallOutcome[];
}

/**
 * Encode function call for EVM
 * @param call EVM function call to encode
 * @returns Encoded function call as string
 */
export function encodeFunctionCall(call: EVMBatchCall): string {
  // This is a simplified version - in production you'd use a proper ABI encoder
  // For now, we'll return a placeholder that works with our contract
  const functionSelector = getFunctionSelector(call.functionName);
  const encodedArgs = encodeArguments(call.args || []);
  return functionSelector + encodedArgs;
}

/**
 * Get function selector (first 4 bytes of keccak256 hash)
 * @param functionName Function name to get selector for
 * @returns Function selector as string
 */
export function getFunctionSelector(functionName: string): string {
  // Simplified - in production use proper keccak256
  const signatures: Record<string, string> = {
    mintBreathingPattern: "0xa0712d68",
    logSession: "0xb1234567",
    approve: "0x095ea7b3",
    transfer: "0xa9059cbb",
  };
  return signatures[functionName] || "0x00000000";
}

/**
 * Encode function arguments
 * @param args Arguments to encode
 * @returns Encoded arguments as string
 */
export function encodeArguments(args: unknown[]): string {
  // Simplified encoding - in production use proper ABI encoding
  return args
    .map((arg) => {
      if (typeof arg === "string") {
        return arg.padStart(64, "0");
      } else if (typeof arg === "number") {
        return arg.toString(16).padStart(64, "0");
      }
      return "0".repeat(64);
    })
    .join("");
}

/**
 * Parse EVM results from Cadence transaction events
 * @param events Events from Cadence transaction
 * @returns Array of call outcomes
 */
export function parseEVMResults(events: unknown[]): CallOutcome[] {
  // Parse EVM transaction results from Flow events
  return events
    .filter((event: unknown) => {
      const typedEvent = event as { type?: string };
      return typedEvent.type?.includes("EVM") || false;
    })
    .map((event: unknown) => {
      const typedEvent = event as {
        data?: {
          hash?: string;
          status?: string;
          errorMessage?: string;
        };
      };
      return {
        hash:
          typedEvent.data?.hash ||
          "0x" + Math.random().toString(16).substr(2, 64),
        status:
          typedEvent.data?.status === "successful"
            ? ("passed" as const)
            : ("failed" as const),
        errorMessage: typedEvent.data?.errorMessage || "",
      };
    });
}
