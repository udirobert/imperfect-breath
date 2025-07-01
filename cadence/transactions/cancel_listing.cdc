
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

transaction(patternID: UInt64) {

    let marketplace: &BreathFlowVision.Marketplace

    prepare(signer: AuthAccount) {
        self.marketplace = signer.borrow<&BreathFlowVision.Marketplace>(from: BreathFlowVision.MarketplaceStoragePath)
            ?? panic("Could not borrow a reference to the marketplace")
    }

    execute {
        self.marketplace.removeListing(patternID: patternID)
    }
}
