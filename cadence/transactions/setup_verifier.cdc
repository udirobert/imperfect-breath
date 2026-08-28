import PracticeCredential from 0xPracticeCredential

/// One-time verifier setup, signed by the contract deployer (the admin).
///
/// 1. Saves the VerifierAdmin resource to the deployer's account if not
///    already present (whoever holds it controls the verifier allowlist).
/// 2. Adds `verifier` to the authorized allowlist so its co-signatures are
///    accepted by PracticeCredential.attest.
///
/// The verifier address must be a Flow account that has the Brume backend's
/// secp256k1 public key registered (see docs/RUNBOOK.md — the backend signs
/// attestation payloads with the matching private key).
transaction(verifier: Address) {
    prepare(admin: auth(Storage) &Account) {
        if admin.storage.borrow<&PracticeCredential.VerifierAdmin>(from: PracticeCredential.VerifierAdminPath) == nil {
            admin.storage.save(
                <- PracticeCredential.createVerifierAdmin(),
                to: PracticeCredential.VerifierAdminPath
            )
        }
        let adminRef = admin.storage.borrow<&PracticeCredential.VerifierAdmin>(
            from: PracticeCredential.VerifierAdminPath
        ) ?? panic("Could not borrow VerifierAdmin")

        PracticeCredential.addVerifier(admin: adminRef, verifier: verifier)
    }
}
