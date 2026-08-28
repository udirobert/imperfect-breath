import PracticeCredential from 0xPracticeCredential

/// Remove a verifier from the authorized allowlist (admin only).
transaction(verifier: Address) {
    prepare(admin: auth(Storage) &Account) {
        let adminRef = admin.storage.borrow<&PracticeCredential.VerifierAdmin>(
            from: PracticeCredential.VerifierAdminPath
        ) ?? panic("Could not borrow VerifierAdmin — run setup_verifier first")

        PracticeCredential.removeVerifier(admin: adminRef, verifier: verifier)
    }
}
