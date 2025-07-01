import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

access(all) fun main(account: Address): [UInt64] {

    let collection = getAccount(account).capabilities.get<&ImperfectBreath.Collection>(ImperfectBreath.CollectionPublicPath)
                        .borrow()
                        ?? panic("Could not borrow a reference to the collection")

    return collection.getIDs()
}
