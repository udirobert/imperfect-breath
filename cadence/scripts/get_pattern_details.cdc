import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

access(all) fun main(account: Address, id: UInt64): NFTDetails {

    let collection = getAccount(account).capabilities.get<&ImperfectBreath.Collection>(ImperfectBreath.CollectionPublicPath)
                        .borrow()
                        ?? panic("Could not borrow a reference to the collection")

    let nft = collection.borrowNFT(id: id)

    // Create a copy of the phases dictionary to avoid reference issues
    let phasesCopy: {String: UInt64} = {}
    for key in nft.phases.keys {
        phasesCopy[key] = nft.phases[key]!
    }

    return NFTDetails(
        id: nft.id,
        name: nft.name,
        description: nft.description,
        creator: nft.creator,
        phases: phasesCopy,
        audioUrl: nft.audioUrl,
        sessionHistoryCount: nft.sessionHistory.length
    )
}

access(all) struct NFTDetails {
    access(all) let id: UInt64
    access(all) let name: String
    access(all) let description: String
    access(all) let creator: Address
    access(all) let phases: {String: UInt64}
    access(all) let audioUrl: String?
    access(all) let sessionHistoryCount: Int

    init(id: UInt64, name: String, description: String, creator: Address, phases: {String: UInt64}, audioUrl: String?, sessionHistoryCount: Int) {
        self.id = id
        self.name = name
        self.description = description
        self.creator = creator
        self.phases = phases
        self.audioUrl = audioUrl
        self.sessionHistoryCount = sessionHistoryCount
    }
}
