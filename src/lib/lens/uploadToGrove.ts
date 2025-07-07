import { StorageClient, immutable } from "@lens-chain/storage-client";
import { lensChain, lensChainMainnet } from "../publicClient";
import { config } from "../../config/environment";

const storageClient = StorageClient.create();

/**
 * Uploads data to Grove storage service for Lens Protocol
 * @param data Any JSON-serializable data to be stored
 * @returns The URI of the uploaded content
 */
export async function uploadToGrove(data: any) {
  try {
    // Use the appropriate chain ID based on environment
    const chainId = config.lens.environment === "testnet" 
      ? lensChain.id 
      : lensChainMainnet.id;
      
    const acl = immutable(chainId);
    const response = await storageClient.uploadAsJson(data, { acl });
    console.log("Uploaded to Grove:", response);
    return response.uri;
  } catch (error) {
    console.error("Failed to upload to Grove:", error);
    throw error;
  }
}
