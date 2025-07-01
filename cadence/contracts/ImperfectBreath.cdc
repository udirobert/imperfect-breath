access(all) contract ImperfectBreath {

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event ForSale(id: UInt64, price: UFix64)
    access(all) event SaleCompleted(id: UInt64, seller: Address, buyer: Address, price: UFix64)
    access(all) event SaleCanceled(id: UInt64)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    access(all) let MarketplaceStoragePath: StoragePath
    access(all) let MarketplacePublicPath: PublicPath

    access(all) var totalSupply: UInt64

    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let creator: Address
        access(all) let phases: {String: UInt64}
        access(all) let audioUrl: String?
        access(all) var sessionHistory: [{String: AnyStruct}]

        init(name: String, description: String, creator: Address, phases: {String: UInt64}, audioUrl: String?) {
            self.id = self.uuid
            self.name = name
            self.description = description
            self.creator = creator
            self.phases = phases
            self.audioUrl = audioUrl
            self.sessionHistory = []
        }

        access(all) fun addSessionData(bpm: UFix64, consistencyScore: UFix64, breathHoldTime: UFix64, aiScore: UFix64) {
            self.sessionHistory.append({
                "timestamp": getCurrentBlock().timestamp,
                "bpm": bpm,
                "consistencyScore": consistencyScore,
                "breathHoldTime": breathHoldTime,
                "aiScore": aiScore
            })
        }
    }

    access(all) resource interface CollectionPublic {
        access(all) fun deposit(token: @NFT)
        access(all) fun getIDs(): [UInt64]
        access(all) fun borrowNFT(id: UInt64): &NFT
    }

    access(all) resource Collection: CollectionPublic {
        access(all) var ownedNFTs: @{UInt64: NFT}

        init() {
            self.ownedNFTs <- {}
        }

        access(all) fun withdraw(withdrawID: UInt64): @NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @NFT) {
            let tokenID = token.id
            let oldToken <- self.ownedNFTs[tokenID] <- token
            emit Deposit(id: tokenID, to: self.owner?.address)
            destroy oldToken
        }

        access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) fun borrowNFT(id: UInt64): &NFT {
            return (&self.ownedNFTs[id])!
        }


    }

    access(all) fun createEmptyCollection(): @Collection {
        return <- create Collection()
    }

    access(all) resource PatternMinter {
        access(all) fun mintPattern(
            name: String,
            description: String,
            creator: Address,
            phases: {String: UInt64},
            audioUrl: String?
        ): @NFT {
            var newNFT <- create NFT(
                name: name,
                description: description,
                creator: creator,
                phases: phases,
                audioUrl: audioUrl
            )
            ImperfectBreath.totalSupply = ImperfectBreath.totalSupply + 1
            return <-newNFT
        }
    }

    access(all) resource Listing {
        access(all) let patternID: UInt64
        access(all) let sellerAddress: Address
        access(all) let price: UFix64

        init(patternID: UInt64, sellerAddress: Address, price: UFix64) {
            self.patternID = patternID
            self.sellerAddress = sellerAddress
            self.price = price
        }
    }

    access(all) resource interface MarketplacePublic {
        access(all) fun getListing(patternID: UInt64): &Listing?
        access(all) fun getListingIDs(): [UInt64]
    }

    access(all) resource Marketplace: MarketplacePublic {
        access(all) var listings: @{UInt64: Listing}

        init() {
            self.listings <- {}
        }

        access(all) fun listNFT(pattern: @NFT, price: UFix64) {
            pre {
                price > 0.0: "Price must be greater than 0"
            }
            let listing <- create Listing(
                patternID: pattern.id,
                sellerAddress: pattern.creator,
                price: price
            )
            let oldListing <- self.listings[listing.patternID] <- listing
            destroy oldListing
            emit ForSale(id: pattern.id, price: price)
            destroy pattern
        }

        access(all) fun purchaseNFT(patternID: UInt64, buyerCollection: &Collection) {
            pre {
                self.listings[patternID] != nil: "No listing with this ID"
            }
            let listing <- self.listings.remove(key: patternID) ?? panic("Listing not found")
            let sellerAddress = listing.sellerAddress
            let price = listing.price

            // For now, we'll implement a simple transfer without payment
            // In production, integrate with FlowToken for actual payments

            // Transfer NFT to buyer
            let sellerCollection = getAccount(sellerAddress).capabilities.get<&Collection>(ImperfectBreath.CollectionPublicPath)
                                    .borrow()
                                    ?? panic("Could not borrow seller's collection reference")
            let nft <- sellerCollection.withdraw(withdrawID: patternID)
            buyerCollection.deposit(token: <-nft)

            emit SaleCompleted(id: patternID, seller: sellerAddress, buyer: buyerCollection.owner!.address, price: price)
            destroy listing
        }

        access(all) fun removeListing(patternID: UInt64) {
            let listing <- self.listings.remove(key: patternID) ?? panic("Listing not found")
            emit SaleCanceled(id: patternID)
            destroy listing
        }

        access(all) fun getListing(patternID: UInt64): &Listing? {
            return &self.listings[patternID]
        }

        access(all) fun getListingIDs(): [UInt64] {
            return self.listings.keys
        }


    }

    access(all) fun createMarketplace(): @Marketplace {
        return <- create Marketplace()
    }

    init() {
        self.totalSupply = 0
        self.CollectionStoragePath = /storage/ImperfectBreathCollection
        self.CollectionPublicPath = /public/ImperfectBreathCollection
        self.MinterStoragePath = /storage/ImperfectBreathMinter
        self.MarketplaceStoragePath = /storage/ImperfectBreathMarketplace
        self.MarketplacePublicPath = /public/ImperfectBreathMarketplace

        self.account.storage.save(<-create PatternMinter(), to: self.MinterStoragePath)
        self.account.storage.save(<-create Marketplace(), to: self.MarketplaceStoragePath)
        let marketplaceCap = self.account.capabilities.storage.issue<&{MarketplacePublic}>(self.MarketplaceStoragePath)
        self.account.capabilities.publish(marketplaceCap, at: self.MarketplacePublicPath)

        emit ContractInitialized()
    }
}
