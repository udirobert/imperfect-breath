// Grove storage client for Lens metadata
import { StorageClient, immutable } from "@lens-chain/storage-client";
import { lensChain, lensChainMainnet } from "../publicClient";

// Create Grove storage client
const groveClient = StorageClient.create();

// Use testnet chain ID by default for reliability
const chainId = lensChain.id;

// ACL configuration for immutable content with chain ID
const acl = immutable(chainId);

export interface LensStorageClient {
  uploadAsJson(
    data: Record<string, unknown>,
  ): Promise<{ uri: string; gatewayUrl: string }>;
  uploadFile(file: File): Promise<{ uri: string; gatewayUrl: string }>;
}

class GroveStorageClient implements LensStorageClient {
  async uploadAsJson(
    data: Record<string, unknown>,
  ): Promise<{ uri: string; gatewayUrl: string }> {
    try {
      const response = await groveClient.uploadAsJson(data, { acl });

      return {
        uri: response.uri,
        gatewayUrl: response.gatewayUrl,
      };
    } catch (error) {
      console.error("Grove upload failed, falling back to data URI:", error);

      // Fallback to data URI if Grove fails
      const jsonString = JSON.stringify(data);
      const uri = `data:application/json,${encodeURIComponent(jsonString)}`;

      return {
        uri,
        gatewayUrl: uri,
      };
    }
  }

  async uploadFile(file: File): Promise<{ uri: string; gatewayUrl: string }> {
    try {
      const response = await groveClient.uploadFile(file, { acl });

      return {
        uri: response.uri,
        gatewayUrl: response.gatewayUrl,
      };
    } catch (error) {
      console.error("Grove file upload failed:", error);
      throw error;
    }
  }
}

export const storageClient = new GroveStorageClient();
