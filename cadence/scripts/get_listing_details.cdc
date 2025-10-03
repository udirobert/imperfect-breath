
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

pub fun main(marketplaceAddress: Address, patternID: UInt64): &ImperfectBreath.Listing? {

    let marketplace = getAccount(marketplaceAddress)
        .getCapability(ImperfectBreath.MarketplacePublicPath)
        .borrow<&ImperfectBreath.Marketplace{ImperfectBreath.MarketplacePublic}>()
        ?? panic("Could not borrow a reference to the marketplace")

    return marketplace.getListing(patternID: patternID)
}
