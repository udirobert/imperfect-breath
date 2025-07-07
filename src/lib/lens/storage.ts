// Grove storage client for Lens metadata
import { StorageClient, immutable } from '@lens-chain/storage-client';
import { lensChain, lensChainMainnet } from "../publicClient";
import { config } from "../../config/environment";

// Create Grove storage client
const groveClient = StorageClient.create();

// Get the appropriate chain ID based on environment
const chainId = config.lens.environment === "testnet" 
  ? lensChain.id 
  : lensChainMainnet.id;

// ACL configuration for immutable content with chain ID
const acl = immutable(chainId);

export interface LensStorageClient {
  uploadAsJson(data: any): Promise<{ uri: string; gatewayUrl: string }>;
  uploadFile(file: File): Promise<{ uri: string; gatewayUrl: string }>;
}

class GroveStorageClient implements LensStorageClient {
  async uploadAsJson(data: any): Promise<{ uri: string; gatewayUrl: string }> {
    try {
      const response = await groveClient.uploadAsJson(data, { acl });
      
      return {
        uri: response.uri,
        gatewayUrl: response.gatewayUrl,
      };
    } catch (error) {
      console.error('Grove upload failed, falling back to data URI:', error);
      
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
      console.error('Grove file upload failed:', error);
      throw error;
    }
  }
}

export const storageClient = new GroveStorageClient();