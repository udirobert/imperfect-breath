
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

transaction(patternID: UInt64, bpm: UFix64, consistencyScore: UFix64, breathHoldTime: UFix64, aiScore: UFix64) {

    let collection: &ImperfectBreath.Collection

    prepare(signer: AuthAccount) {
        self.collection = signer.borrow<&ImperfectBreath.Collection>(from: ImperfectBreath.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's collection")
    }

    execute {
        let nftRef = self.collection.borrowNFT(id: patternID)
        nftRef.addSessionData(bpm: bpm, consistencyScore: consistencyScore, breathHoldTime: breathHoldTime, aiScore: aiScore)
    }
}
