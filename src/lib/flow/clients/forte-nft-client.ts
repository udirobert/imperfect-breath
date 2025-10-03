/**\n * Enhanced NFT Client with Forte Actions and Cross-Network Integration\n * Unified NFT operations with atomic marketplace and social features\n */

import BaseFlowClient from './base-client';
import type {
  BreathingPatternNFT,
  BreathingPatternAttributes,
  NFTMetadata,
  RoyaltyInfo,
  FlowTransactionResult
} from '../types';
import { handleError } from '../../errors/error-types';
import { startTimer, timed } from '../../../lib/utils/performance-utils';
import { getCache } from '../../../lib/utils/cache-utils';
import CrossNetworkIntegration from '../cross-network/cross-network-integration';

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

export class ForteNFTClient {
  private baseClient: BaseFlowClient;
  private cache = getCache();
  private crossNetwork: CrossNetworkIntegration;
  
  constructor() {
    this.baseClient = BaseFlowClient.getInstance();
    this.crossNetwork = new CrossNetworkIntegration();
  }
  
  /**\n   * Setup account for NFT collection\n   */
  async setupAccount(): Promise<string> {
    const endTimer = startTimer('setupAccount');
    try {
      const txId = await this.baseClient.sendTransaction(TRANSACTIONS.SETUP_ACCOUNT);
      await this.baseClient.waitForTransaction(txId);
      return txId;
    } catch (error) {
      throw handleError('setup NFT account', error);
    }
  }
  
  /**\n   * Mint a breathing pattern NFT with automatic Lens post\n   */
  async mintBreathingPatternWithSocial(
    attributes: BreathingPatternAttributes,
    metadata: NFTMetadata,
    recipient: string,
    royalties: RoyaltyInfo[] = [],
    postToLens: boolean = true
  ): Promise<{ txId: string; lensPost: any | null }> {
    const endTimer = startTimer('mintBreathingPatternWithSocial');
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
      
      // Invalidate any cached NFTs for this account
      this.cache.delete(`nfts-${recipient}`);
      
      // Post to Lens if requested
      let lensPost = null;
      if (postToLens) {
        const nftForPost: BreathingPatternNFT = {
          id: 'pending', // Will be updated after mint confirmation
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          attributes: attributes,
          owner: recipient,
          creator: recipient,
          royalties: royalties,
          metadata: metadata
        };
        
        lensPost = await this.crossNetwork.postMintToLens({
          nft: nftForPost,
          transactionId: txId,
          uniqueId: `mint_${txId}`,
          creatorAddress: recipient
        });
      }
      
      return { txId, lensPost };
    } catch (error) {
      throw handleError('mint breathing pattern with social', error);
    } finally {
      endTimer();
    }
  }

  /**\n   * Purchase NFT from marketplace with payment and social posting\n   */
  async purchaseNFTWithSocial(
    nftId: string,
    price: number,
    marketplaceAddress: string,
    postToLens: boolean = true
  ): Promise<{ txId: string; lensPost: any | null }> {
    const endTimer = startTimer('purchaseNFTWithSocial');
    try {
      // Transaction that handles both NFT transfer and payment
      const purchaseTransaction = `
        import ImperfectBreath from 0xProfile
        import FlowToken from 0xFlowToken
        import FungibleToken from 0xFungibleToken

        transaction(patternID: UInt64, marketplaceAddress: Address) {
          let buyerCollection: &ImperfectBreath.Collection
          let marketplace: &ImperfectBreath.Marketplace{ImperfectBreath.MarketplacePublic}
          let flowTokenVault: @FungibleToken.Vault

          prepare(signer: AuthAccount) {
            self.buyerCollection = signer.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
                ?? panic("Could not borrow a reference to the buyer's collection")

            self.marketplace = getAccount(marketplaceAddress)
                .getCapability(ImperfectBreath.MarketplacePublicPath)
                .borrow<&ImperfectBreath.Marketplace{ImperfectBreath.MarketplacePublic}>()
                ?? panic("Could not borrow a reference to the marketplace")

            let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow buyer's FlowToken vault reference")
            // For this transaction, we withdraw the needed amount for the purchase
            self.flowTokenVault <- vaultRef.withdraw(amount: UFix64("${price}"))
          }

          execute {
            self.marketplace.purchaseNFTWithPayment(
              patternID: patternID, 
              buyerCollection: self.buyerCollection,
              payment: <-self.flowTokenVault
            )
          }
        }
      `;
      
      const args = [parseInt(nftId), marketplaceAddress];
      const txId = await this.baseClient.sendTransaction(purchaseTransaction, args);
      const result = await this.baseClient.waitForTransaction(txId);
      
      if (result.status !== 4) { // 4 = SEALED
        throw new Error(`Purchase transaction failed: ${result.errorMessage}`);
      }
      
      // Invalidate caches for both buyer and seller
      const buyerAddress = this.baseClient.getCurrentUserAddress();
      if (buyerAddress) {
        this.cache.delete(`nfts-${buyerAddress}`);
        this.cache.delete(`nft-ids-${buyerAddress}`);
      }
      
      // Post to Lens if requested
      let lensPost = null;
      if (postToLens) {
        // We would need to fetch the NFT details to create the post
        // For now, we'll mock it
        const mockNFT: BreathingPatternNFT = {
          id: nftId,
          name: `Purchased NFT ${nftId}`,
          description: `Recently purchased breathing pattern`,
          image: 'https://via.placeholder.com/300x300?text=NFT',
          attributes: {
            inhale: 4,
            hold: 4,
            exhale: 4,
            rest: 4,
            difficulty: 'beginner',
            category: 'wellness',
            tags: ['breathing', 'nft'],
            totalCycles: 10,
            estimatedDuration: 160,
          },
          owner: buyerAddress || '',
          creator: 'mock-creator',
          royalties: [],
          metadata: {
            name: `Purchased NFT ${nftId}`,
            description: `Recently purchased breathing pattern`,
            image: 'https://via.placeholder.com/300x300?text=NFT',
            attributes: [],
          }
        };
        
        lensPost = await this.crossNetwork.postPurchaseToLens({
          nft: mockNFT,
          transactionId: txId,
          uniqueId: `purchase_${txId}`,
          buyerAddress: buyerAddress || '',
          price: price
        });
      }
      
      return { txId, lensPost };
    } catch (error) {
      throw handleError('purchase NFT with social', error);
    } finally {
      endTimer();
    }
  }

  /**\n   * Execute atomic Forte Actions transaction with social posting\n   */
  async executeForteTransactionWithSocial(
    actions: Array<{
      type: 'source' | 'sink' | 'swap' | 'nft_transfer';
      params: Record<string, any>;
    }>,
    nft: BreathingPatternNFT,
    lensAction: 'purchase' | 'mint' | 'sale'
  ): Promise<{ forteResult: any; lensPost: any | null }> {
    const endTimer = startTimer('executeForteTransactionWithSocial');
    try {
      return await this.crossNetwork.executeForteWithLensIntegration(
        actions,
        lensAction,
        nft
      );
    } catch (error) {
      throw handleError('execute Forte transaction with social', error);
    } finally {
      endTimer();
    }
  }
  
  /**\n   * Transfer NFT to another account\n   */
  async transferNFT(nftId: string, recipient: string, sender?: string): Promise<string> {
    const endTimer = startTimer('transferNFT');
    try {
      const args = [recipient, parseInt(nftId)];
      const txId = await this.baseClient.sendTransaction(TRANSACTIONS.TRANSFER_NFT, args);
      await this.baseClient.waitForTransaction(txId);
      
      // Invalidate any cached NFTs for both accounts
      if (sender) {
        this.cache.delete(`nfts-${sender}`);
        this.cache.delete(`nft-ids-${sender}`);
      }
      this.cache.delete(`nfts-${recipient}`);
      this.cache.delete(`nft-ids-${recipient}`);
      
      return txId;
    } catch (error) {
      throw handleError('transfer NFT', error);
    } finally {
      endTimer();
    }
  }
  
  /**\n   * Purchase NFT from marketplace with payment\n   */
  async purchaseNFT(nftId: string, price: number, marketplaceAddress: string): Promise<string> {
    const endTimer = startTimer('purchaseNFT');
    try {
      // Transaction that handles both NFT transfer and payment
      const purchaseTransaction = `
        import ImperfectBreath from 0xProfile
        import FlowToken from 0xFlowToken
        import FungibleToken from 0xFungibleToken

        transaction(patternID: UInt64, marketplaceAddress: Address) {
          let buyerCollection: &ImperfectBreath.Collection
          let marketplace: &ImperfectBreath.Marketplace{ImperfectBreath.MarketplacePublic}
          let flowTokenVault: @FungibleToken.Vault

          prepare(signer: AuthAccount) {
            self.buyerCollection = signer.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
                ?? panic("Could not borrow a reference to the buyer's collection")

            self.marketplace = getAccount(marketplaceAddress)
                .getCapability(ImperfectBreath.MarketplacePublicPath)
                .borrow<&ImperfectBreath.Marketplace{ImperfectBreath.MarketplacePublic}>()
                ?? panic("Could not borrow a reference to the marketplace")

            let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow buyer's FlowToken vault reference")
            // For this transaction, we withdraw the needed amount for the purchase
            self.flowTokenVault <- vaultRef.withdraw(amount: UFix64("${price}"))
          }

          execute {
            self.marketplace.purchaseNFTWithPayment(
              patternID: patternID, 
              buyerCollection: self.buyerCollection,
              payment: <-self.flowTokenVault
            )
          }
        }
      `;
      
      const args = [parseInt(nftId), marketplaceAddress];
      const txId = await this.baseClient.sendTransaction(purchaseTransaction, args);
      const result = await this.baseClient.waitForTransaction(txId);
      
      if (result.status !== 4) { // 4 = SEALED
        throw new Error(`Purchase transaction failed: ${result.errorMessage}`);
      }
      
      // Invalidate caches for both buyer and seller
      const buyerAddress = this.baseClient.getCurrentUserAddress();
      if (buyerAddress) {
        this.cache.delete(`nfts-${buyerAddress}`);
        this.cache.delete(`nft-ids-${buyerAddress}`);
      }
      
      return txId;
    } catch (error) {
      throw handleError('purchase NFT', error);
    } finally {
      endTimer();
    }
  }
  
  /**\n   * Get NFT IDs owned by an account\n   */
  async getNFTIds(account: string): Promise<string[]> {
    const endTimer = startTimer('getNFTIds');
    const cacheKey = `nft-ids-${account}`;
    
    // Try to get from cache first
    const cached = this.cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const ids = await this.baseClient.executeScript<number[]>(SCRIPTS.GET_NFT_IDS, [account]);
      const stringIds = ids.map(id => id.toString());
      
      // Cache for 1 minute
      this.cache.set(cacheKey, stringIds, 60000);
      
      return stringIds;
    } catch (error) {
      throw handleError('get NFT IDs', error);
    } finally {
      endTimer();
    }
  }
  
  /**\n   * Get NFT metadata\n   */
  async getNFTMetadata(account: string, nftId: string): Promise<BreathingPatternNFT | null> {
    const endTimer = startTimer('getNFTMetadata');
    const cacheKey = `nft-metadata-${account}-${nftId}`;
    
    // Try to get from cache first
    const cached = this.cache.get<BreathingPatternNFT>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const metadata = await this.baseClient.executeScript(
        SCRIPTS.GET_NFT_METADATA,
        [account, parseInt(nftId)]
      );
      
      if (!metadata) {
        return null;
      }
      
      const nft: BreathingPatternNFT = {
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
      
      // Cache for 5 minutes
      this.cache.set(cacheKey, nft, 5 * 60 * 1000);
      
      return nft;
    } catch (error) {
      throw handleError('get NFT metadata', error);
    } finally {
      endTimer();
    }
  }
  
  /**\n   * Get all NFTs owned by an account\n   */
  async getAllNFTs(account: string): Promise<BreathingPatternNFT[]> {
    const outerTimer = startTimer('getAllNFTs');
    const cacheKey = `nfts-${account}`;
    
    // Try to get from cache first
    const cached = this.cache.get<BreathingPatternNFT[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const endTimer = startTimer('getAllNFTs-fetch');
    
    try {
      const ids = await this.getNFTIds(account);
      const nfts: BreathingPatternNFT[] = [];
      
      // Use Promise.all for parallel execution
      const nftPromises = ids.map(id => this.getNFTMetadata(account, id));
      const results = await Promise.all(nftPromises);
      
      for (const nft of results) {
        if (nft) {
          nfts.push(nft);
        }
      }
      
      // Cache for 2 minutes
      this.cache.set(cacheKey, nfts, 2 * 60 * 1000);
      
      const duration = endTimer();
      console.log(`Fetched ${nfts.length} NFTs in ${duration.toFixed(2)}ms`);
      
      return nfts;
    } catch (error) {
      endTimer();
      throw handleError('get all NFTs', error);
    } finally {
      outerTimer();
    }
  }
  
  /**\n   * Get collection length\n   */
  async getCollectionLength(account: string): Promise<number> {
    const endTimer = startTimer('getCollectionLength');
    try {
      return await this.baseClient.executeScript<number>(SCRIPTS.GET_COLLECTION_LENGTH, [account]);
    } catch (error) {
      throw handleError('get collection length', error);
    } finally {
      endTimer();
    }
  }
  
  /**\n   * Check if account has collection setup\n   */
  async hasCollectionSetup(account: string): Promise<boolean> {
    const endTimer = startTimer('hasCollectionSetup');
    try {
      await this.baseClient.executeScript(SCRIPTS.GET_COLLECTION_LENGTH, [account]);
      return true;
    } catch (error) {
      // This is not a true error case - just checking if collection exists
      return false;
    } finally {
      endTimer();
    }
  }
  
  /**\n   * Batch mint multiple patterns\n   */
  async batchMintPatterns(
    patterns: Array<{
      attributes: BreathingPatternAttributes;
      metadata: NFTMetadata;
      recipient: string;
      royalties?: RoyaltyInfo[];
    }>
  ): Promise<string[]> {
    const txIds: string[] = [];
    const endTimer = startTimer('batchMintPatterns');
    
    // Track recipients to invalidate caches later
    const recipients = new Set<string>();
    
    for (const pattern of patterns) {
      try {
        const txId = await this.mintBreathingPattern(
          pattern.attributes,
          pattern.metadata,
          pattern.recipient,
          pattern.royalties
        );
        txIds.push(txId);
        recipients.add(pattern.recipient);
      } catch (error) {
        // Log but continue with other patterns
        console.error(`Failed to mint pattern "${pattern.metadata.name}":`, error);
      }
    }
    
    // Invalidate caches for all recipients
    recipients.forEach(recipient => {
      this.cache.delete(`nfts-${recipient}`);
      this.cache.delete(`nft-ids-${recipient}`);
    });
    
    const duration = endTimer();
    console.log(`Batch minted ${txIds.length}/${patterns.length} patterns in ${duration.toFixed(2)}ms`);
    
    return txIds;
  }
  
  /**\n   * Get NFT events\n   */
  async getNFTEvents(nftId: string): Promise<any[]> {
    const endTimer = startTimer('getNFTEvents');
    try {
      // This would require a more complex script to fetch events
      // TODO: Implement event fetching when needed
      return [];
    } catch (error) {
      throw handleError('get NFT events', error);
    } finally {
      endTimer();
    }
  }
}

export default ForteNFTClient;