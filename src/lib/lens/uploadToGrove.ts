import { StorageClient, immutable } from "@lens-chain/storage-client";
import { lensChain, lensChainMainnet } from "../publicClient";

const storageClient = StorageClient.create();

/**
 * Uploads data to Grove storage service for Lens Protocol
 * @param data Any JSON-serializable data to be stored
 * @returns The URI of the uploaded content
 */
export async function uploadToGrove(data: Record<string, unknown>) {
  try {
    // Use testnet chain ID by default for reliability
    const chainId = lensChain.id;

    const acl = immutable(chainId);
    const response = await storageClient.uploadAsJson(data, { acl });
    console.log("Uploaded to Grove:", response);
    return response.uri;
  } catch (error) {
    console.error("Failed to upload to Grove:", error);
    throw error;
  }
}
