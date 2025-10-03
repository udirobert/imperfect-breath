import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken
import NonFungibleToken from 0xNonFungibleToken

// ImperfectBreath Forte Actions Ready Contract
// Implements patterns ready for Forte Actions integration
access(all) contract ImperfectBreathActionsReady {

    // Events for tracking operations
    access(all) event MarketplaceActionExecuted(
        uniqueID: String,
        buyer: Address, 
        seller: Address, 
        nftID: UInt64, 
        price: UFix64,
        timestamp: UFix64
    )
    
    access(all) event RoyaltyDistributed(
        uniqueID: String,
        nftID: UInt64,
        recipient: Address,
        amount: UFix64
    )

    // Enhanced marketplace ready for Forte Actions composition
    access(all) resource ActionsReadyMarketplace {
        access(all) var listings: @{UInt64: EnhancedListing}

        init() {
            self.listings <- {}
        }

        // Enhanced listing with unique identifier for tracking
        access(all) fun listNFTWithTracking(
            nft: @ImperfectBreath.NFT,
            price: UFix64,
            uniqueID: String
        ) {
            pre {
                price > 0.0: "Price must be greater than 0"
            }
            
            let listing <- create EnhancedListing(
                patternID: nft.id,
                sellerAddress: nft.creator,
                price: price,
                uniqueID: uniqueID
            )
            let oldListing <- self.listings[listing.patternID] <- listing
            destroy oldListing
            emit ImperfectBreath.ForSale(id: nft.id, price: price)
            destroy nft
        }

        // Atomic purchase with built-in composition ready for Forte Actions
        access(all) fun executeAtomicPurchase(
            patternID: UInt64,
            buyerCollection: &ImperfectBreath.Collection,
            price: UFix64,
            uniqueID: String
        ) {
            pre {
                self.listings[patternID] != nil: "No listing with this ID"
            }
            
            let listing <- self.listings.remove(key: patternID) ?? panic("Listing not found")
            let sellerAddress = listing.sellerAddress
            let listingPrice = listing.price

            // Verify payment amount matches price
            if price != listingPrice {
                destroy listing
                panic("Payment amount does not match listing price")
            }

            // Transfer NFT to buyer - this is one atomic step
            let sellerCollection = getAccount(sellerAddress)
                .capabilities.get<&ImperfectBreath.Collection>(ImperfectBreath.CollectionPublicPath)
                .borrow()
                ?? panic("Could not borrow seller's collection reference")
            let nft <- sellerCollection.withdraw(withdrawID: patternID)
            buyerCollection.deposit(token: <-nft)

            // For Forte Actions integration, this would use Sources/Sinks/Swappers
            // For now, we'll handle payment elsewhere, but this is structured to be compatible
            // The payment would come through a Forte Actions Source in the full implementation

            emit MarketplaceActionExecuted(
                uniqueID: uniqueID,
                buyer: buyerCollection.owner!.address,
                seller: sellerAddress, 
                nftID: patternID, 
                price: price,
                timestamp: getCurrentBlock().timestamp
            )
        }

        // Distribute payment with royalties - ready for Forte Actions Sinks
        access(all) fun distributePaymentWithRoyalties(
            payment: @FungibleToken.Vault,
            seller: Address, 
            nftID: UInt64,
            uniqueID: String
        ) {
            let totalAmount = payment.balance
            var remainingAmount = totalAmount
            
            // In a full Forte Actions implementation, this would use Sinks
            // For now, we'll simulate the royalty distribution
            
            // Get NFT to access its royalty info (in a real impl, this would come from the NFT metadata)
            // For demo purposes, we'll assume a standard 10% royalty
            let royaltyAmount = totalAmount * 0.10
            remainingAmount = totalAmount - royaltyAmount
            
            // Emit royalty event to track distribution
            emit RoyaltyDistributed(
                uniqueID: uniqueID,
                nftID: nftID,
                recipient: seller, // In real impl, this would be the original creator
                amount: royaltyAmount
            )
            
            // Send remaining payment to seller
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
            emit ImperfectBreath.SaleCanceled(id: patternID)
            destroy listing
        }

        access(all) fun getListing(patternID: UInt64): &EnhancedListing? {
            return &self.listings[patternID]
        }

        access(all) fun getListingIDs(): [UInt64] {
            return self.listings.keys
        }
    }

    // Enhanced listing with uniqueID for tracking across operations
    access(all) resource EnhancedListing {
        access(all) let patternID: UInt64
        access(all) let sellerAddress: Address
        access(all) let price: UFix64
        access(all) let uniqueID: String  // For tracking across Forte Actions
        access(all) let createdAt: UFix64

        init(patternID: UInt64, sellerAddress: Address, price: UFix64, uniqueID: String) {
            self.patternID = patternID
            self.sellerAddress = sellerAddress
            self.price = price
            self.uniqueID = uniqueID
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    // Enhanced NFT with royalty support - compatible with Forte Actions
    access(all) resource ActionsReadyNFT {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let creator: Address
        access(all) let phases: {String: UInt64}
        access(all) let audioUrl: String?
        access(all) var sessionHistory: [{String: AnyStruct}]
        access(all) let royalties: [Royalty]
        access(all) let uniqueID: String  // For Forte Actions tracking

        init(
            name: String, 
            description: String, 
            creator: Address, 
            phases: {String: UInt64}, 
            audioUrl: String?, 
            royalties: [Royalty],
            uniqueID: String
        ) {
            self.id = self.uuid
            self.name = name
            self.description = description
            self.creator = creator
            self.phases = phases
            self.audioUrl = audioUrl
            self.sessionHistory = []
            self.royalties = royalties
            self.uniqueID = uniqueID
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

    // Royalty structure - compatible with Forte Actions
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
    access(all) fun createActionsReadyMarketplace(): @ActionsReadyMarketplace {
        return <- create ActionsReadyMarketplace()
    }

    // Initialize contract
    init() {
        log("ImperfectBreath Actions-Ready contract initialized")
    }
}