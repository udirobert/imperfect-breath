import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";

export interface PatternData {
  name: string;
  description: string;
  phases: Record<string, number>;
  audioUrl?: string;
}

export interface SessionData {
  patternId: string;
  duration: number;
  bpm?: number;
  consistencyScore?: number;
  breathHoldTime?: number;
  aiScore?: number;
}

export interface NFTDetails {
  id: string;
  name: string;
  description: string;
  creator: string;
  phases: Record<string, number>;
  audioUrl?: string;
  sessionHistoryCount: number;
}

export interface ListingDetails {
  patternID: string;
  sellerAddress: string;
  price: string;
}

export class FlowNFTClient {
  private contractAddress: string;

  constructor() {
    this.contractAddress =
      import.meta.env.VITE_IMPERFECT_BREATH_ADDRESS || "0xb8404e09b36b6623";
  }

  /**
   * Setup user account for NFT collection
   */
  async setupAccount(): Promise<string> {
    const cadence = `
      import ImperfectBreath from ${this.contractAddress}

      transaction {
        prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
          // If the user doesn't have a collection yet, create a new empty collection.
          if signer.storage.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath) == nil {
            signer.storage.save(<-ImperfectBreath.createEmptyCollection(), to: ImperfectBreath.CollectionStoragePath)

            // Create a public capability for the collection
            let collectionCap = signer.capabilities.storage.issue<&ImperfectBreath.Collection>(ImperfectBreath.CollectionStoragePath)
            signer.capabilities.publish(collectionCap, at: ImperfectBreath.CollectionPublicPath)
          }
        }
      }
    `;

    try {
      const transactionId = await fcl.mutate({
        cadence,
        args: () => [],
        proposer: fcl.currentUser().authorization,
        payer: fcl.currentUser().authorization,
        authorizations: [fcl.currentUser().authorization],
        limit: 9999,
      });

      console.log("Account setup transaction ID:", transactionId);

      const result = await fcl.tx(transactionId).onceSealed();

      if (result.status === 4) {
        // SEALED
        return transactionId;
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }
    } catch (error) {
      console.error("Failed to setup account:", error);
      throw error;
    }
  }

  /**
   * Mint a new breathing pattern NFT
   */
  async mintBreathingPattern(patternData: PatternData): Promise<string> {
    const cadence = `
      import ImperfectBreath from ${this.contractAddress}

      transaction(name: String, description: String, phases: {String: UInt64}, audioUrl: String?) {
        let minter: &ImperfectBreath.PatternMinter
        let collection: &ImperfectBreath.Collection

        prepare(signer: auth(BorrowValue) &Account) {
          self.minter = signer.storage.borrow<&ImperfectBreath.PatternMinter>(from: ImperfectBreath.MinterStoragePath)
            ?? panic("Could not borrow a reference to the minter")

          // Borrow a reference to the signer's collection.
          self.collection = signer.storage.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's collection")
        }

        execute {
          let newNFT <- self.minter.mintPattern(
            name: name,
            description: description,
            creator: self.collection.owner!.address,
            phases: phases,
            audioUrl: audioUrl
          )
          self.collection.deposit(token: <-newNFT)
        }
      }
    `;

    try {
      const transactionId = await fcl.mutate({
        cadence,
        args: (arg, t) => [
          arg(patternData.name, t.String),
          arg(patternData.description, t.String),
          arg(
            Object.entries(patternData.phases).map(([key, value]) => ({
              key,
              value: parseInt(value.toString()),
            })),
            t.Dictionary({ key: t.String, value: t.UInt64 }),
          ),
          arg(patternData.audioUrl || null, t.Optional(t.String)),
        ],
        proposer: fcl.currentUser().authorization,
        payer: fcl.currentUser().authorization,
        authorizations: [fcl.currentUser().authorization],
        limit: 9999,
      });

      console.log("Pattern minted, transaction ID:", transactionId);

      const result = await fcl.tx(transactionId).onceSealed();

      if (result.status === 4) {
        return transactionId;
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }
    } catch (error) {
      console.error("Failed to mint breathing pattern:", error);
      throw error;
    }
  }

  /**
   * List an NFT for sale in the marketplace
   */
  async listPatternForSale(patternId: string, price: number): Promise<string> {
    const cadence = `
      import ImperfectBreath from ${this.contractAddress}

      transaction(patternId: UInt64, price: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          // Get the collection reference
          let collection = signer.storage.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
            ?? panic("Could not borrow collection reference")

          // Withdraw the NFT
          let nft <- collection.withdraw(withdrawID: patternId)

          // Get the marketplace reference
          let marketplace = signer.storage.borrow<&ImperfectBreath.Marketplace>(from: ImperfectBreath.MarketplaceStoragePath)
            ?? panic("Could not borrow marketplace reference")

          // List the NFT for sale
          marketplace.listNFT(pattern: <-nft, price: price)
        }
      }
    `;

    try {
      const transactionId = await fcl.mutate({
        cadence,
        args: (arg, t) => [
          arg(patternId, t.UInt64),
          arg(price.toFixed(8), t.UFix64),
        ],
        proposer: fcl.currentUser().authorization,
        payer: fcl.currentUser().authorization,
        authorizations: [fcl.currentUser().authorization],
        limit: 9999,
      });

      console.log("Pattern listed for sale, transaction ID:", transactionId);

      const result = await fcl.tx(transactionId).onceSealed();

      if (result.status === 4) {
        return transactionId;
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }
    } catch (error) {
      console.error("Failed to list pattern for sale:", error);
      throw error;
    }
  }

  /**
   * Purchase an NFT from the marketplace (simplified version without payment)
   */
  async purchasePattern(patternId: string): Promise<string> {
    const cadence = `
      import ImperfectBreath from ${this.contractAddress}

      transaction(patternId: UInt64) {
        prepare(signer: auth(BorrowValue) &Account) {
          // Get the buyer's collection reference
          let collection = signer.storage.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
            ?? panic("Could not borrow collection reference")

          // Get the marketplace reference
          let marketplace = getAccount(${this.contractAddress})
            .capabilities.get<&ImperfectBreath.Marketplace>(ImperfectBreath.MarketplacePublicPath)
            .borrow()
            ?? panic("Could not borrow marketplace reference")

          // Purchase the NFT (simplified without payment)
          marketplace.purchaseNFT(patternID: patternId, buyerCollection: collection)
        }
      }
    `;

    try {
      const transactionId = await fcl.mutate({
        cadence,
        args: (arg, t) => [arg(patternId, t.UInt64)],
        proposer: fcl.currentUser().authorization,
        payer: fcl.currentUser().authorization,
        authorizations: [fcl.currentUser().authorization],
        limit: 9999,
      });

      console.log("Pattern purchased, transaction ID:", transactionId);

      const result = await fcl.tx(transactionId).onceSealed();

      if (result.status === 4) {
        return transactionId;
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }
    } catch (error) {
      console.error("Failed to purchase pattern:", error);
      throw error;
    }
  }

  /**
   * Log session data to NFT
   */
  async logSessionData(
    patternId: string,
    sessionData: SessionData,
  ): Promise<string> {
    const cadence = `
      import ImperfectBreath from ${this.contractAddress}

      transaction(patternId: UInt64, bpm: UFix64, consistencyScore: UFix64, breathHoldTime: UFix64, aiScore: UFix64) {
        prepare(signer: auth(BorrowValue) &Account) {
          // Get the collection reference
          let collection = signer.storage.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
            ?? panic("Could not borrow collection reference")

          // Borrow the NFT
          let nft = collection.borrowNFT(id: patternId)

          // Add session data
          nft.addSessionData(
            bpm: bpm,
            consistencyScore: consistencyScore,
            breathHoldTime: breathHoldTime,
            aiScore: aiScore
          )
        }
      }
    `;

    try {
      const transactionId = await fcl.mutate({
        cadence,
        args: (arg, t) => [
          arg(patternId, t.UInt64),
          arg((sessionData.bpm || 0).toFixed(2), t.UFix64),
          arg((sessionData.consistencyScore || 0).toFixed(2), t.UFix64),
          arg((sessionData.breathHoldTime || 0).toFixed(2), t.UFix64),
          arg((sessionData.aiScore || 0).toFixed(2), t.UFix64),
        ],
        proposer: fcl.currentUser().authorization,
        payer: fcl.currentUser().authorization,
        authorizations: [fcl.currentUser().authorization],
        limit: 9999,
      });

      console.log("Session data logged, transaction ID:", transactionId);

      const result = await fcl.tx(transactionId).onceSealed();

      if (result.status === 4) {
        return transactionId;
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }
    } catch (error) {
      console.error("Failed to log session data:", error);
      throw error;
    }
  }

  /**
   * Get user's NFT collection IDs
   */
  async getUserCollection(address: string): Promise<string[]> {
    const script = `
      import ImperfectBreath from ${this.contractAddress}

      access(all) fun main(account: Address): [UInt64] {
        let collection = getAccount(account).capabilities.get<&ImperfectBreath.Collection>(ImperfectBreath.CollectionPublicPath)
                            .borrow()
                            ?? panic("Could not borrow a reference to the collection")

        return collection.getIDs()
      }
    `;

    try {
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });

      console.log("User collection IDs:", result);
      return (result || []).map((id: number | string) => id.toString());
    } catch (error) {
      console.error("Failed to get user collection:", error);
      return [];
    }
  }

  /**
   * Get NFT details
   */
  async getNFTDetails(
    address: string,
    nftId: string,
  ): Promise<NFTDetails | null> {
    const script = `
      import ImperfectBreath from ${this.contractAddress}

      access(all) fun main(account: Address, id: UInt64): NFTDetails {
        let collection = getAccount(account).capabilities.get<&ImperfectBreath.Collection>(ImperfectBreath.CollectionPublicPath)
                            .borrow()
                            ?? panic("Could not borrow a reference to the collection")

        let nft = collection.borrowNFT(id: id)

        // Create a copy of the phases dictionary to avoid reference issues
        let phasesCopy: {String: UInt64} = {}
        for key in nft.phases.keys {
            phasesCopy[key] = nft.phases[key]!
        }

        return NFTDetails(
            id: nft.id,
            name: nft.name,
            description: nft.description,
            creator: nft.creator,
            phases: phasesCopy,
            audioUrl: nft.audioUrl,
            sessionHistoryCount: nft.sessionHistory.length
        )
      }

      access(all) struct NFTDetails {
          access(all) let id: UInt64
          access(all) let name: String
          access(all) let description: String
          access(all) let creator: Address
          access(all) let phases: {String: UInt64}
          access(all) let audioUrl: String?
          access(all) let sessionHistoryCount: Int

          init(id: UInt64, name: String, description: String, creator: Address, phases: {String: UInt64}, audioUrl: String?, sessionHistoryCount: Int) {
              self.id = id
              self.name = name
              self.description = description
              self.creator = creator
              self.phases = phases
              self.audioUrl = audioUrl
              self.sessionHistoryCount = sessionHistoryCount
          }
      }
    `;

    try {
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address), arg(nftId, t.UInt64)],
      });

      console.log("NFT details:", result);

      if (result) {
        // Convert phases back to number format
        const phases: Record<string, number> = {};
        Object.entries(result.phases).forEach(([key, value]) => {
          phases[key] = parseInt(value as string);
        });

        return {
          id: result.id.toString(),
          name: result.name,
          description: result.description,
          creator: result.creator,
          phases: phases,
          audioUrl: result.audioUrl,
          sessionHistoryCount: result.sessionHistoryCount,
        };
      }

      return null;
    } catch (error) {
      console.error("Failed to get NFT details:", error);
      return null;
    }
  }

  /**
   * Get marketplace listings
   */
  async getMarketplaceListings(): Promise<string[]> {
    const script = `
      import ImperfectBreath from ${this.contractAddress}

      access(all) fun main(): [UInt64] {
        let marketplace = getAccount(${this.contractAddress})
          .capabilities.get<&ImperfectBreath.Marketplace>(ImperfectBreath.MarketplacePublicPath)
          .borrow()
          ?? panic("Could not borrow marketplace reference")

        return marketplace.getListingIDs()
      }
    `;

    try {
      const result = await fcl.query({
        cadence: script,
      });

      console.log("Marketplace listings:", result);
      return (result || []).map((id: number | string) => id.toString());
    } catch (error) {
      console.error("Failed to get marketplace listings:", error);
      return [];
    }
  }

  /**
   * Get listing details
   */
  async getListingDetails(patternId: string): Promise<ListingDetails | null> {
    const script = `
      import ImperfectBreath from ${this.contractAddress}

      access(all) fun main(patternId: UInt64): ListingDetails? {
        let marketplace = getAccount(${this.contractAddress})
          .capabilities.get<&ImperfectBreath.Marketplace>(ImperfectBreath.MarketplacePublicPath)
          .borrow()
          ?? panic("Could not borrow marketplace reference")

        if let listing = marketplace.getListing(patternID: patternId) {
          return ListingDetails(
            patternID: listing.patternID,
            sellerAddress: listing.sellerAddress,
            price: listing.price
          )
        }

        return nil
      }

      access(all) struct ListingDetails {
        access(all) let patternID: UInt64
        access(all) let sellerAddress: Address
        access(all) let price: UFix64

        init(patternID: UInt64, sellerAddress: Address, price: UFix64) {
          self.patternID = patternID
          self.sellerAddress = sellerAddress
          self.price = price
        }
      }
    `;

    try {
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(patternId, t.UInt64)],
      });

      console.log("Listing details:", result);

      if (result) {
        return {
          patternID: result.patternID.toString(),
          sellerAddress: result.sellerAddress,
          price: result.price.toString(),
        };
      }

      return null;
    } catch (error) {
      console.error("Failed to get listing details:", error);
      return null;
    }
  }

  /**
   * Check if user has a collection setup
   */
  async hasCollectionSetup(address: string): Promise<boolean> {
    const script = `
      import ImperfectBreath from ${this.contractAddress}

      access(all) fun main(address: Address): Bool {
        let account = getAccount(address)
        let collectionRef = account.capabilities.get<&ImperfectBreath.Collection>(ImperfectBreath.CollectionPublicPath)
          .borrow()

        return collectionRef != nil
      }
    `;

    try {
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });

      return result === true;
    } catch (error) {
      console.error("Failed to check collection setup:", error);
      return false;
    }
  }
}

export const flowNFTClient = new FlowNFTClient();
