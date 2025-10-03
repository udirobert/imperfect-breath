import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken
import NonFungibleToken from 0xNonFungibleToken

// Enhanced ImperfectBreath contract with Forte Actions compatibility
access(all) contract ImperfectBreathEnhanced {

    // Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event ForSale(id: UInt64, price: UFix64)
    access(all) event SaleCompleted(id: UInt64, seller: Address, buyer: Address, price: UFix64)
    access(all) event SaleCanceled(id: UInt64)
    access(all) event RoyaltyPaid(id: UInt64, recipient: Address, amount: UFix64)

    // Paths and addresses
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    access(all) let MarketplaceStoragePath: StoragePath
    access(all) let MarketplacePublicPath: PublicPath

    access(all) var totalSupply: UInt64

    // Enhanced NFT resource with royalty support
    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let creator: Address
        access(all) let phases: {String: UInt64}
        access(all) let audioUrl: String?
        access(all) var sessionHistory: [{String: AnyStruct}]
        access(all) let royalties: [Royalty]

        init(name: String, description: String, creator: Address, phases: {String: UInt64}, 
             audioUrl: String?, royalties: [Royalty]) {
            self.id = self.uuid
            self.name = name
            self.description = description
            self.creator = creator
            self.phases = phases
            self.audioUrl = audioUrl
            self.sessionHistory = []
            self.royalties = royalties
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

    // Enhanced Collection resource
    access(all) resource interface CollectionPublic {
        access(all) fun deposit(token: @NFT)
        access(all) fun withdraw(withdrawID: UInt64): @NFT
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

    // Enhanced PatternMinter with royalty support
    access(all) resource PatternMinter {
        access(all) fun mintPattern(
            name: String,
            description: String,
            creator: Address,
            phases: {String: UInt64},
            audioUrl: String?,
            royalties: [Royalty]
        ): @NFT {
            var newNFT <- create NFT(
                name: name,
                description: description,
                creator: creator,
                phases: phases,
                audioUrl: audioUrl,
                royalties: royalties
            )
            ImperfectBreathEnhanced.totalSupply = ImperfectBreathEnhanced.totalSupply + 1
            return <-newNFT
        }
    }

    // Enhanced Listing resource with royalty distribution
    access(all) resource Listing {
        access(all) let patternID: UInt64
        access(all) let sellerAddress: Address
        access(all) let price: UFix64
        access(all) let createdAt: UFix64

        init(patternID: UInt64, sellerAddress: Address, price: UFix64) {
            self.patternID = patternID
            self.sellerAddress = sellerAddress
            self.price = price
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    // Enhanced Marketplace with Forte Actions compatibility
    access(all) resource interface MarketplacePublic {
        access(all) fun getListing(patternID: UInt64): &Listing?
        access(all) fun getListingIDs(): [UInt64]
    }

    access(all) resource Marketplace: MarketplacePublic {
        access(all) var listings: @{UInt64: Listing}

        init() {
            self.listings <- {}
        }

        // List NFT for sale
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

        // Purchase NFT with payment - Enhanced for Forte Actions
        access(all) fun purchaseNFTWithPayment(
            patternID: UInt64, 
            buyerCollection: &Collection,
            payment: @FungibleToken.Vault
        ) {
            pre {
                self.listings[patternID] != nil: "No listing with this ID"
            }
            
            let listing <- self.listings.remove(key: patternID) ?? panic("Listing not found")
            let sellerAddress = listing.sellerAddress
            let price = listing.price

            // Verify payment amount matches price
            if payment.balance != price {
                destroy payment
                destroy listing
                panic("Payment amount does not match listing price")
            }

            // Transfer NFT to buyer
            let sellerCollection = getAccount(sellerAddress).capabilities.get<&Collection>(/public/ImperfectBreathCollection)
                                    .borrow()
                                    ?? panic("Could not borrow seller's collection reference")
            let nft <- sellerCollection.withdraw(withdrawID: patternID)
            buyerCollection.deposit(token: <-nft)

            // Distribute payments including royalties
            self.distributePayment(payment: <-payment, seller: sellerAddress, nft: &nft)

            emit SaleCompleted(id: patternID, seller: sellerAddress, buyer: buyerCollection.owner!.address, price: price)
            destroy listing
        }

        // Helper function to distribute payments with royalties
        access(all) fun distributePayment(payment: @FungibleToken.Vault, seller: Address, nft: &NFT) {
            let totalAmount = payment.balance
            var remainingAmount = totalAmount
            
            // Distribute royalties to creators/holders
            for royalty in nft.royalties {
                let royaltyAmount = totalAmount * royalty.cut
                remainingAmount = remainingAmount - royaltyAmount
                
                // Transfer royalty payment
                let royaltyReceiver = getAccount(royalty.recipient)
                    .capabilities.borrow<&{FungibleToken.Receiver}>(
                        /public/flowTokenReceiver
                    )
                    ?? panic("Could not get royalty receiver")
                
                let royaltyVault <- payment.withdraw(amount: royaltyAmount)
                royaltyReceiver.deposit(from: <-royaltyVault)
                
                emit RoyaltyPaid(id: nft.id, recipient: royalty.recipient, amount: royaltyAmount)
            }
            
            // Send remaining amount to seller (after royalties)
            let sellerReceiver = getAccount(seller)
                .capabilities.borrow<&{FungibleToken.Receiver}>(
                    /public/flowTokenReceiver
                )
                ?? panic("Could not get seller receiver")
            
            let sellerVault <- payment.withdraw(amount: remainingAmount)
            sellerReceiver.deposit(from: <-sellerVault)
            
            // Destroy the remaining empty vault
            destroy payment
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

    // Royalty structure
    access(all) struct Royalty {
        access(all) let recipient: Address
        access(all) let cut: UFix64  // Percentage (0.0 - 1.0)
        access(all) let description: String
        
        init(recipient: Address, cut: UFix64, description: String) {
            pre {
                cut >= 0.0 && cut <= 1.0: "Royalty cut must be between 0.0 and 1.0"
            }
            self.recipient = recipient
            self.cut = cut
            self.description = description
        }
    }

    // Create marketplace function
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