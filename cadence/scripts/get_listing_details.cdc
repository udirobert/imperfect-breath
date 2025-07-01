
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

pub fun main(marketplaceAddress: Address, patternID: UInt64): &BreathFlowVision.Listing? {

    let marketplace = getAccount(marketplaceAddress)
        .getCapability(BreathFlowVision.MarketplacePublicPath)
        .borrow<&BreathFlowVision.Marketplace{BreathFlowVision.MarketplacePublic}>()
        ?? panic("Could not borrow a reference to the marketplace")

    return marketplace.getListing(patternID: patternID)
}
