
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

transaction(patternID: UInt64) {

    let marketplace: &ImperfectBreath.Marketplace

    prepare(signer: AuthAccount) {
        self.marketplace = signer.borrow<&ImperfectBreath.Marketplace>(from: ImperfectBreath.MarketplaceStoragePath)
            ?? panic("Could not borrow a reference to the marketplace")
    }

    execute {
        self.marketplace.removeListing(patternID: patternID)
    }
}
