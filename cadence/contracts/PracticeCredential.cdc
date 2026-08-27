/// PracticeCredential.cdc — Brume verified practice records
///
/// Non-transferable attestations of camera-verified breathwork sessions.
/// Deliberately minimal: no marketplace, no sale events, no transfer.
/// These are records, not assets (see docs/STRATEGY.md — attestations, not collectibles).

access(all) contract PracticeCredential {

    access(all) event PracticeAttested(id: UInt64, subject: Address, sessionId: String, score: UFix64)
    access(all) event ContractInitialized()

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    access(all) var totalIssued: UInt64

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

    /// Issue a credential into a collection. Called by the user-initiated
    /// attest_practice transaction — the server never holds keys
    /// (see backend/vision-service/main.py /api/attest).
    access(all) fun attest(
        sessionId: String,
        subject: Address,
        score: UFix64,
        verifier: Address,
        collection: &Collection
    ): UInt64 {
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

    init() {
        self.totalIssued = 0
        self.CollectionStoragePath = /storage/PracticeCredentialCollection
        self.CollectionPublicPath = /public/PracticeCredentialCollection
        emit ContractInitialized()
    }
}
