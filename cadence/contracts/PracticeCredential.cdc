/// PracticeCredential.cdc — Brume verified practice records
///
/// Non-transferable attestations of camera-verified breathwork sessions.
/// Deliberately minimal: no marketplace, no sale events, no transfer.
/// These are records, not assets (see docs/STRATEGY.md — attestations, not collectibles).
///
/// Security: `attest` requires an authorized verifier signature. The contract
/// stores an allowlist of verifier addresses (managed by the contract admin).
/// A credential is only valid if the `verifierSignature` was produced by an
/// address in the allowlist. This prevents self-issuance — a user cannot mint
/// a score-100 credential without a real verifier co-signing.

access(all) contract PracticeCredential {

    access(all) event PracticeAttested(id: UInt64, subject: Address, sessionId: String, score: UFix64)
    access(all) event ContractInitialized()
    access(all) event VerifierAdded(verifier: Address)
    access(all) event VerifierRemoved(verifier: Address)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    access(all) var totalIssued: UInt64

    /// Authorized verifier addresses. Only these can co-sign credential
    /// issuance. Managed by the contract admin via addVerifier/removeVerifier.
    access(all) var verifiers: {Address: Bool}

    access(all) let VerifierAdminPath: StoragePath

    /// A single verified practice record.
    access(all) resource Credential {
        access(all) let id: UInt64
        access(all) let sessionId: String
        access(all) let subject: Address
        access(all) let score: UFix64
        access(all) let issuedAt: UFix64
        access(all) let verifier: Address

        init(sessionId: String, subject: Address, score: UFix64, verifier: Address) {
            self.id = self.uuid
            self.sessionId = sessionId
            self.subject = subject
            self.score = score
            self.issuedAt = getCurrentBlock().timestamp
            self.verifier = verifier
        }
    }

    /// Holds a user's credentials. NO withdraw function is exposed:
    /// credentials are non-transferable by construction.
    access(all) resource Collection {
        access(all) var credentials: @{UInt64: Credential}

        init() {
            self.credentials = {}
        }

        access(all) fun deposit(credential: @Credential) {
            self.credentials[credential.id] <-! credential
        }

        access(all) fun getIDs(): [UInt64] {
            return self.credentials.keys
        }

        access(all) fun borrowCredential(id: UInt64): &Credential? {
            return &self.credentials[id]
        }
    }

    access(all) fun createEmptyCollection(): @Collection {
        return <- create Collection()
    }

    /// Issue a credential into a collection. Requires that `verifier` is an
    /// authorized verifier address AND `verifierSignature` is a valid
    /// signature over the attestation payload (sessionId + subject + score)
    /// produced by the `verifier` address's key.
    ///
    /// This means: the user initiates the transaction (pays gas, deposits into
    /// their own collection), but the credential is only valid if the Brume
    /// backend (an authorized verifier) co-signed the attestation. The backend
    /// only signs after server-side camera verification (see /api/attest).
    access(all) fun attest(
        sessionId: String,
        subject: Address,
        score: UFix64,
        verifier: Address,
        verifierSignature: [UInt8],
        signedData: [UInt8],
        collection: &Collection
    ): UInt64 {
        // 1. The verifier must be in the authorized allowlist.
        if !self.verifiers.containsKey(verifier) {
            panic("PracticeCredential: verifier not authorized")
        }

        // 2. The signature must be valid — produced by the verifier's key,
        //    over the exact payload (signedData = sessionId || subject || score).
        //    We look up the verifier's public key from their account.
        let verifierAccount = getAccount(verifier)
        let publicKeys = verifierAccount.keys
        var signatureValid = false
        var i = 0
        while i < publicKeys.len() {
            let key = publicKeys[i]
            if !key.isRevoked {
                let isValid = key.publicKey.verify(
                    signature: verifierSignature,
                    signedData: signedData,
                    domainSeparationTag: "Brume-PracticeCredential-v1"
                )
                if isValid {
                    signatureValid = true
                    break
                }
            }
            i = i + 1
        }
        if !signatureValid {
            panic("PracticeCredential: invalid verifier signature — backend co-signature required")
        }

        let credential <- create Credential(
            sessionId: sessionId,
            subject: subject,
            score: score,
            verifier: verifier
        )
        let id = credential.id
        emit PracticeAttested(id: id, subject: subject, sessionId: sessionId, score: score)
        collection.deposit(credential: <- credential)
        self.totalIssued = self.totalIssued + 1
        return id
    }

    // --- Verifier management (admin-only) -----------------------------------

    access(all) fun isAuthorizedVerifier(_ address: Address): Bool {
        return self.verifiers.containsKey(address)
    }

    /// Add a verifier to the allowlist. Only callable by the admin resource
    /// holder (stored at VerifierAdminPath).
    access(all) fun addVerifier(admin: &VerifierAdmin, verifier: Address) {
        self.verifiers[verifier] = true
        emit VerifierAdded(verifier: verifier)
    }

    access(all) fun removeVerifier(admin: &VerifierAdmin, verifier: Address) {
        self.verifiers.remove(key: verifier)
        emit VerifierRemoved(verifier: verifier)
    }

    /// Admin resource — deployed once and stored, used to manage verifiers.
    access(all) resource VerifierAdmin {
        init() {}
    }

    access(all) fun createVerifierAdmin(): @VerifierAdmin {
        return <- create VerifierAdmin()
    }

    init() {
        self.totalIssued = 0
        self.verifiers = {}
        self.CollectionStoragePath = /storage/PracticeCredentialCollection
        self.CollectionPublicPath = /public/PracticeCredentialCollection
        self.VerifierAdminPath = /storage/PracticeCredentialVerifierAdmin
        emit ContractInitialized()
    }
}
