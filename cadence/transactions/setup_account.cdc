import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

transaction {

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {

        // If the user doesn't have a collection yet, create a new empty collection.
        if signer.storage.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath) == nil {
            signer.storage.save(<-ImperfectBreath.createEmptyCollection(), to: ImperfectBreath.CollectionStoragePath)

            // Create a public capability for the collection
            let collectionCap = signer.capabilities.storage.issue<&ImperfectBreath.Collection>(ImperfectBreath.CollectionStoragePath)
            signer.capabilities.publish(collectionCap, at: ImperfectBreath.CollectionPublicPath)
        }
    }
}
