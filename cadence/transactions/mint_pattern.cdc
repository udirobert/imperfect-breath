import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

transaction(name: String, description: String, phases: {String: UInt64}, audioUrl: String?) {

    let minter: &ImperfectBreath.PatternMinter
    let collection: &ImperfectBreath.Collection

    prepare(signer: auth(BorrowValue) &Account) {
        self.minter = signer.storage.borrow<&ImperfectBreath.PatternMinter>(from: ImperfectBreath.MinterStoragePath)
            ?? panic("Could not borrow a reference to the minter")

        // Borrow a reference to the signer's collection.
        self.collection = signer.storage.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's collection")
    }

    execute {
        let newNFT <- self.minter.mintPattern(
            name: name,
            description: description,
            creator: self.collection.owner!.address,
            phases: phases,
            audioUrl: audioUrl
        )
        self.collection.deposit(token: <-newNFT)
    }
}
