import PracticeCredential from 0xPracticeCredential

/// User-initiated proof-of-practice attestation.
/// The signer self-issues a credential for a session the Brume backend verified.
/// Keys stay client-side; the backend only verifies and records.
///
/// Security: `verifierSignature` is a co-signature from the Brume backend's
/// authorized verifier key over `signedData` (the attestation payload). The
/// contract checks that (a) the verifier is authorized and (b) the signature
/// is valid, so a user cannot self-issue without backend verification.
transaction(
    sessionId: String,
    score: UFix64,
    verifier: Address,
    verifierSignature: [UInt8],
    signedData: [UInt8]
) {
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
            verifierSignature: verifierSignature,
            signedData: signedData,
            collection: collection
        )
    }
}
