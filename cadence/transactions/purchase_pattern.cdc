
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

transaction(patternID: UInt64, amount: UFix64, marketplaceAddress: Address) {

    let buyerCollection: &BreathFlowVision.Collection
    let marketplace: &BreathFlowVision.Marketplace{BreathFlowVision.MarketplacePublic}
    let flowTokenVault: @FungibleToken.Vault

    prepare(signer: AuthAccount) {
        self.buyerCollection = signer.borrow<&BreathFlowVision.Collection>(from: BreathFlowVision.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the buyer's collection")

        self.marketplace = getAccount(marketplaceAddress)
            .getCapability(BreathFlowVision.MarketplacePublicPath)
            .borrow<&BreathFlowVision.Marketplace{BreathFlowVision.MarketplacePublic}>()
            ?? panic("Could not borrow a reference to the marketplace")

        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow owner's FlowToken vault reference")
        self.flowTokenVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        self.marketplace.purchaseNFT(patternID: patternID, buyerCollection: self.buyerCollection, payment: <-self.flowTokenVault)
    }
}
