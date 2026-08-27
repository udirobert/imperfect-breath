import PracticeCredential from 0xPracticeCredential

/// User-initiated proof-of-practice attestation.
/// The signer self-issues a credential for a session the Brume backend verified.
/// Keys stay client-side; the backend only verifies and records.
transaction(sessionId: String, score: UFix64, verifier: Address) {
    prepare(signer: auth(Storage) &Account) {
        if signer.storage.borrow<&PracticeCredential.Collection>(from: PracticeCredential.CollectionStoragePath) == nil {
            signer.storage.save(
                <- PracticeCredential.createEmptyCollection(),
                to: PracticeCredential.CollectionStoragePath
            )
        }

        let collection = signer.storage.borrow<&PracticeCredential.Collection>(
            from: PracticeCredential.CollectionStoragePath
        ) ?? panic("Could not borrow credential collection")

        PracticeCredential.attest(
            sessionId: sessionId,
            subject: signer.address,
            score: score,
            verifier: verifier,
            collection: collection
        )
    }
}
