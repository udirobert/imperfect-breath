
import ImperfectBreath from "../contracts/ImperfectBreath.cdc"

transaction(patternID: UInt64, bpm: UFix64, consistencyScore: UFix64, breathHoldTime: UFix64, aiScore: UFix64) {

    let collection: &BreathFlowVision.Collection

    prepare(signer: AuthAccount) {
        self.collection = signer.borrow<&BreathFlowVision.Collection>(from: BreathFlowVision.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's collection")
    }

    execute {
        let nftRef = self.collection.borrowNFT(id: patternID)
            as! &BreathFlowVision.NFT
        nftRef.addSessionData(bpm: bpm, consistencyScore: consistencyScore, breathHoldTime: breathHoldTime, aiScore: aiScore)
    }
}
