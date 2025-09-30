/**
 * Grove Storage Client for Lens Protocol v3
 *
 * Simplified and consolidated Grove storage operations
 * Removes duplications and uses proper Lens v3 patterns
 */

import { StorageClient, immutable } from "@lens-chain/storage-client";
import { currentNetwork } from "./config";
import type { BreathingSession, PostMetadata } from "./types";

// Create storage client
const storageClient = StorageClient.create();

/**
 * Upload JSON metadata to Grove storage
 */
export async function uploadMetadataToGrove(
  metadata: PostMetadata,
): Promise<string> {
  try {
    const acl = immutable(currentNetwork.chainId);
    const response = await storageClient.uploadAsJson(metadata, { acl });

    console.log("Metadata uploaded to Grove:", {
      uri: response.uri,
      size: JSON.stringify(metadata).length,
      title: metadata.title,
    });

    return response.uri;
  } catch (error) {
    console.error("Failed to upload metadata to Grove:", error);
    throw new Error(`Grove upload failed: ${(error as Error).message}`);
  }
}

/**
 * Upload breathing session data to Grove
 */
export async function uploadBreathingSessionToGrove(
  sessionData: BreathingSession,
): Promise<string> {
  try {
    const acl = immutable(currentNetwork.chainId);
    const response = await storageClient.uploadAsJson(sessionData, { acl });

    console.log("Breathing session uploaded to Grove:", {
      uri: response.uri,
      pattern: sessionData.patternName,
      duration: sessionData.duration,
    });

    return response.uri;
  } catch (error) {
    console.error("Failed to upload session to Grove:", error);
    throw new Error(`Grove session upload failed: ${(error as Error).message}`);
  }
}

/**
 * Upload arbitrary JSON data to Grove storage
 */
export async function uploadToGrove(
  data: Record<string, unknown>,
): Promise<string> {
  try {
    const acl = immutable(currentNetwork.chainId);
    const response = await storageClient.uploadAsJson(data, { acl });

    console.log("Data uploaded to Grove:", {
      uri: response.uri,
      size: JSON.stringify(data).length,
    });

    return response.uri;
  } catch (error) {
    console.error("Failed to upload to Grove:", error);
    throw new Error(`Grove upload failed: ${(error as Error).message}`);
  }
}

/**
 * Upload image/media file to Grove storage
 */
export async function uploadFileToGrove(
  file: File | Blob,
  mimeType?: string,
): Promise<string> {
  try {
    const acl = immutable(currentNetwork.chainId);

    // Convert to appropriate format for upload
    const uploadData =
      file instanceof File
        ? file
        : new File([file], "upload", {
            type: mimeType || "application/octet-stream",
          });

    const response = await storageClient.uploadFile(uploadData, { acl });

    console.log("File uploaded to Grove:", {
      uri: response.uri,
      size: uploadData.size,
      type: uploadData.type,
    });

    return response.uri;
  } catch (error) {
    console.error("Failed to upload file to Grove:", error);
    throw new Error(`Grove file upload failed: ${(error as Error).message}`);
  }
}

/**
 * Check if Grove is available and configured properly
 */
export async function checkGroveAvailability(): Promise<boolean> {
  try {
    // Test with a small metadata upload
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      network: currentNetwork.name,
    };

    await uploadToGrove(testData);
    return true;
  } catch (error) {
    console.warn("Grove storage not available:", error);
    return false;
  }
}

/**
 * Get estimated storage cost (if applicable)
 */
export function estimateStorageCost(dataSizeBytes: number): {
  estimatedCost: number;
  currency: string;
} {
  // Grove storage is currently free on testnet
  // This is a placeholder for future cost estimation
  return {
    estimatedCost: 0,
    currency: currentNetwork.currency,
  };
}

/**
 * Validate data before Grove upload
 */
export function validateForGroveUpload(data: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push("Data cannot be null or undefined");
    return { isValid: false, errors };
  }

  try {
    const jsonString = JSON.stringify(data);

    // Check size limits (10MB for Grove)
    const sizeInBytes = new TextEncoder().encode(jsonString).length;
    if (sizeInBytes > 10 * 1024 * 1024) {
      errors.push("Data exceeds 10MB size limit");
    }

    // Check for circular references
    JSON.parse(jsonString);
  } catch (error) {
    errors.push("Data contains circular references or is not serializable");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create fallback data URI if Grove upload fails
 */
export function createFallbackDataUri(data: unknown): string {
  try {
    const jsonString = JSON.stringify(data);
    const base64 = btoa(jsonString);
    return `data:application/json;base64,${base64}`;
  } catch (error) {
    console.error("Failed to create fallback data URI:", error);
    throw new Error("Cannot create fallback data URI");
  }
}

/**
 * Upload with automatic fallback to data URI
 */
export async function uploadWithFallback(data: unknown): Promise<string> {
  const validation = validateForGroveUpload(data);
  if (!validation.isValid) {
    console.warn("Data validation failed, using fallback:", validation.errors);
    return createFallbackDataUri(data);
  }

  try {
    return await uploadToGrove(data as Record<string, unknown>);
  } catch (error) {
    console.warn("Grove upload failed, using fallback:", error);
    return createFallbackDataUri(data);
  }
}
