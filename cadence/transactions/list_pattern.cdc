
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"
import FlowToken from 0xFlowToken

transaction(patternID: UInt64, price: UFix64) {

    let collection: &ImperfectBreath.Collection
    let marketplace: &ImperfectBreath.Marketplace

    prepare(signer: AuthAccount) {
        self.collection = signer.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's collection")

        self.marketplace = signer.borrow<&ImperfectBreath.Marketplace>(from: ImperfectBreath.MarketplaceStoragePath)
            ?? panic("Could not borrow a reference to the marketplace")
    }

    execute {
        let nft <- self.collection.withdraw(withdrawID: patternID)
        self.marketplace.listNFT(pattern: <-nft, price: price)
    }
}
