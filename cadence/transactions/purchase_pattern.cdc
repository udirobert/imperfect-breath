
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

transaction(patternID: UInt64, amount: UFix64, marketplaceAddress: Address) {

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
            ?? panic("Could not borrow owner's FlowToken vault reference")
        self.flowTokenVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // Note: The contract's purchaseNFT function needs to be updated to accept payment
        // For now, we'll deposit the payment back to the buyer's vault as a placeholder
        self.marketplace.purchaseNFT(patternID: patternID, buyerCollection: self.buyerCollection)
        signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow buyer's FlowToken vault")
        signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)!.deposit(from: <-self.flowTokenVault)
    }
}
