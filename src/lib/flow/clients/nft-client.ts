/**
 * Consolidated NFT Client
 * Unified NFT operations for breathing patterns
 */

import BaseFlowClient from './base-client';
import type { 
  BreathingPatternNFT, 
  BreathingPatternAttributes, 
  NFTMetadata, 
  RoyaltyInfo,
  FlowTransactionResult 
} from '../types';

// Cadence scripts and transactions
const SCRIPTS = {
  GET_NFT_IDS: `
    import ImperfectBreath from 0xProfile

    pub fun main(account: Address): [UInt64] {
        let collection = getAccount(account)
            .getCapability(ImperfectBreath.CollectionPublicPath)
            .borrow<&{ImperfectBreath.CollectionPublic}>()
            ?? panic("Could not borrow collection reference")
        
        return collection.getIDs()
    }
  `,
  
  GET_NFT_METADATA: `
    import ImperfectBreath from 0xProfile

    pub fun main(account: Address, id: UInt64): ImperfectBreath.PatternMetadata? {
        let collection = getAccount(account)
            .getCapability(ImperfectBreath.CollectionPublicPath)
            .borrow<&{ImperfectBreath.CollectionPublic}>()
            ?? panic("Could not borrow collection reference")
        
        return collection.getPatternMetadata(id: id)
    }
  `,
  
  GET_COLLECTION_LENGTH: `
    import ImperfectBreath from 0xProfile

    pub fun main(account: Address): Int {
        let collection = getAccount(account)
            .getCapability(ImperfectBreath.CollectionPublicPath)
            .borrow<&{ImperfectBreath.CollectionPublic}>()
            ?? panic("Could not borrow collection reference")
        
        return collection.getIDs().length
    }
  `
};

const TRANSACTIONS = {
  SETUP_ACCOUNT: `
    import ImperfectBreath from 0xProfile
    import NonFungibleToken from 0xNonFungibleToken

    transaction {
        prepare(signer: AuthAccount) {
            if signer.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath) == nil {
                let collection <- ImperfectBreath.createEmptyCollection()
                signer.save(<-collection, to: ImperfectBreath.CollectionStoragePath)
                
                signer.link<&{ImperfectBreath.CollectionPublic}>(
                    ImperfectBreath.CollectionPublicPath,
                    target: ImperfectBreath.CollectionStoragePath
                )
            }
        }
    }
  `,
  
  MINT_PATTERN: `
    import ImperfectBreath from 0xProfile

    transaction(
        name: String,
        description: String,
        image: String,
        inhale: UInt32,
        hold: UInt32,
        exhale: UInt32,
        rest: UInt32,
        difficulty: String,
        category: String,
        tags: [String],
        recipient: Address,
        royalties: [ImperfectBreath.Royalty]
    ) {
        let minter: &ImperfectBreath.NFTMinter

        prepare(signer: AuthAccount) {
            self.minter = signer.borrow<&ImperfectBreath.NFTMinter>(from: ImperfectBreath.MinterStoragePath)
                ?? panic("Could not borrow minter reference")
        }

        execute {
            let attributes = ImperfectBreath.PatternAttributes(
                inhale: inhale,
                hold: hold,
                exhale: exhale,
                rest: rest,
                difficulty: difficulty,
                category: category,
                tags: tags,
                totalCycles: 0,
                estimatedDuration: UInt32(inhale + hold + exhale + rest)
            )

            let metadata = ImperfectBreath.PatternMetadata(
                name: name,
                description: description,
                image: image,
                attributes: attributes,
                royalties: royalties
            )

            self.minter.mintNFT(recipient: recipient, metadata: metadata)
        }
    }
  `,
  
  TRANSFER_NFT: `
    import ImperfectBreath from 0xProfile
    import NonFungibleToken from 0xNonFungibleToken

    transaction(recipient: Address, withdrawID: UInt64) {
        prepare(signer: AuthAccount) {
            let collection = signer.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
                ?? panic("Could not borrow collection reference")

            let recipientCollection = getAccount(recipient)
                .getCapability(ImperfectBreath.CollectionPublicPath)
                .borrow<&{ImperfectBreath.CollectionPublic}>()
                ?? panic("Could not borrow recipient collection reference")

            let nft <- collection.withdraw(withdrawID: withdrawID)
            recipientCollection.deposit(token: <-nft)
        }
    }
  `
};

export class NFTClient {
  private baseClient: BaseFlowClient;
  
  constructor() {
    this.baseClient = BaseFlowClient.getInstance();
  }
  
  /**
   * Setup account for NFT collection
   */
  async setupAccount(): Promise<string> {
    try {
      const txId = await this.baseClient.sendTransaction(TRANSACTIONS.SETUP_ACCOUNT);
      await this.baseClient.waitForTransaction(txId);
      return txId;
    } catch (error) {
      console.error('Failed to setup account:', error);
      throw error;
    }
  }
  
  /**
   * Mint a breathing pattern NFT
   */
  async mintBreathingPattern(
    attributes: BreathingPatternAttributes,
    metadata: NFTMetadata,
    recipient: string,
    royalties: RoyaltyInfo[] = []
  ): Promise<string> {
    try {
      // Convert royalties to Cadence format
      const cadenceRoyalties = royalties.map(royalty => ({
        receiver: royalty.receiver,
        cut: royalty.cut / 100, // Convert percentage to decimal
        description: royalty.description,
      }));
      
      const args = [
        metadata.name,
        metadata.description,
        metadata.image,
        attributes.inhale,
        attributes.hold,
        attributes.exhale,
        attributes.rest,
        attributes.difficulty,
        attributes.category,
        attributes.tags,
        recipient,
        cadenceRoyalties,
      ];
      
      const txId = await this.baseClient.sendTransaction(TRANSACTIONS.MINT_PATTERN, args);
      const result = await this.baseClient.waitForTransaction(txId);
      
      if (result.status !== 4) { // 4 = SEALED
        throw new Error(`Transaction failed: ${result.errorMessage}`);
      }
      
      return txId;
    } catch (error) {
      console.error('Failed to mint breathing pattern:', error);
      throw error;
    }
  }
  
  /**
   * Transfer NFT to another account
   */
  async transferNFT(nftId: string, recipient: string): Promise<string> {
    try {
      const args = [recipient, parseInt(nftId)];
      const txId = await this.baseClient.sendTransaction(TRANSACTIONS.TRANSFER_NFT, args);
      await this.baseClient.waitForTransaction(txId);
      return txId;
    } catch (error) {
      console.error('Failed to transfer NFT:', error);
      throw error;
    }
  }
  
  /**
   * Get NFT IDs owned by an account
   */
  async getNFTIds(account: string): Promise<string[]> {
    try {
      const ids = await this.baseClient.executeScript<number[]>(SCRIPTS.GET_NFT_IDS, [account]);
      return ids.map(id => id.toString());
    } catch (error) {
      console.error('Failed to get NFT IDs:', error);
      return [];
    }
  }
  
  /**
   * Get NFT metadata
   */
  async getNFTMetadata(account: string, nftId: string): Promise<BreathingPatternNFT | null> {
    try {
      const metadata = await this.baseClient.executeScript(
        SCRIPTS.GET_NFT_METADATA, 
        [account, parseInt(nftId)]
      );
      
      if (!metadata) {
        return null;
      }
      
      return {
        id: nftId,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        attributes: {
          inhale: metadata.attributes.inhale,
          hold: metadata.attributes.hold,
          exhale: metadata.attributes.exhale,
          rest: metadata.attributes.rest,
          difficulty: metadata.attributes.difficulty,
          category: metadata.attributes.category,
          tags: metadata.attributes.tags,
          totalCycles: metadata.attributes.totalCycles,
          estimatedDuration: metadata.attributes.estimatedDuration,
        },
        owner: account,
        creator: metadata.creator || account,
        royalties: metadata.royalties || [],
        metadata: {
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          attributes: metadata.attributes.tags.map((tag: string) => ({
            trait_type: 'Tag',
            value: tag,
          })),
        },
      };
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      return null;
    }
  }
  
  /**
   * Get all NFTs owned by an account
   */
  async getAllNFTs(account: string): Promise<BreathingPatternNFT[]> {
    try {
      const ids = await this.getNFTIds(account);
      const nfts: BreathingPatternNFT[] = [];
      
      for (const id of ids) {
        const nft = await this.getNFTMetadata(account, id);
        if (nft) {
          nfts.push(nft);
        }
      }
      
      return nfts;
    } catch (error) {
      console.error('Failed to get all NFTs:', error);
      return [];
    }
  }
  
  /**
   * Get collection length
   */
  async getCollectionLength(account: string): Promise<number> {
    try {
      return await this.baseClient.executeScript<number>(SCRIPTS.GET_COLLECTION_LENGTH, [account]);
    } catch (error) {
      console.error('Failed to get collection length:', error);
      return 0;
    }
  }
  
  /**
   * Check if account has collection setup
   */
  async hasCollectionSetup(account: string): Promise<boolean> {
    try {
      await this.baseClient.executeScript(SCRIPTS.GET_COLLECTION_LENGTH, [account]);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Batch mint multiple patterns
   */
  async batchMintPatterns(
    patterns: Array<{
      attributes: BreathingPatternAttributes;
      metadata: NFTMetadata;
      recipient: string;
      royalties?: RoyaltyInfo[];
    }>
  ): Promise<string[]> {
    const txIds: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const txId = await this.mintBreathingPattern(
          pattern.attributes,
          pattern.metadata,
          pattern.recipient,
          pattern.royalties
        );
        txIds.push(txId);
      } catch (error) {
        console.error('Failed to mint pattern in batch:', error);
        // Continue with other patterns
      }
    }
    
    return txIds;
  }
  
  /**
   * Get NFT events
   */
  async getNFTEvents(nftId: string): Promise<any[]> {
    try {
      // This would require a more complex script to fetch events
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get NFT events:', error);
      return [];
    }
  }
}

export default NFTClient;