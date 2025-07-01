import { StorageClient, immutable } from "@lens-chain/storage-client";
// TODO: Replace with proper chain configuration
// import { chains } from "wagmi/chains"; // Using wagmi chains for chain ID

const storageClient = StorageClient.create();

export async function uploadToGrove(data: any) {
  try {
    const acl = immutable(chains.sepolia.id); // Using Sepolia for Lens Testnet
    const response = await storageClient.uploadAsJson(data, { acl });
    console.log("Uploaded to Grove:", response);
    return response.uri;
  } catch (error) {
    console.error("Failed to upload to Grove:", error);
    throw error;
  }
}
