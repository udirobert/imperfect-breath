/**
 * attestPracticeOnChain — user-initiated Flow write for verified practice.
 *
 * Keys stay client-side (Privacy Policy: "all blockchain transactions are
 * user-initiated and cryptographically signed"). Requires the
 * PracticeCredential contract deployed (cadence/contracts/PracticeCredential.cdc)
 * and VITE_PRACTICE_CREDENTIAL_ADDRESS set. Throws on any failure — callers
 * decide how to present it (useAttestation keeps the honest "queued" state).
 */
import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";

const CONTRACT_ADDRESS = import.meta.env.VITE_PRACTICE_CREDENTIAL_ADDRESS as string | undefined;
const VERIFIER_ADDRESS = (import.meta.env.VITE_BRUME_VERIFIER_ADDRESS as string | undefined) ?? CONTRACT_ADDRESS;

export async function attestPracticeOnChain(args: {
  sessionId: string;
  score: number;
}): Promise<string> {
  if (!CONTRACT_ADDRESS) throw new Error("credential_contract_not_configured");

  const user = await fcl.currentUser().snapshot();
  if (!user.loggedIn) throw new Error("wallet_not_connected");

  const cadence = `
    import PracticeCredential from ${CONTRACT_ADDRESS}

    transaction(sessionId: String, score: UFix64, verifier: Address) {
      prepare(signer: auth(Storage) &Account) {
        if signer.storage.borrow<&PracticeCredential.Collection>(from: PracticeCredential.CollectionStoragePath) == nil {
          signer.storage.save(<- PracticeCredential.createEmptyCollection(), to: PracticeCredential.CollectionStoragePath)
        }
        let collection = signer.storage.borrow<&PracticeCredential.Collection>(from: PracticeCredential.CollectionStoragePath)
          ?? panic("Could not borrow credential collection")
        PracticeCredential.attest(sessionId: sessionId, subject: signer.address, score: score, verifier: verifier, collection: collection)
      }
    }
  `;

  const transactionId = await fcl.mutate({
    cadence,
    args: (arg, types) => [
      arg(args.sessionId, types.String),
      arg(args.score.toFixed(2), types.UFix64),
      arg(VERIFIER_ADDRESS, types.Address),
    ],
    proposer: fcl.currentUser().authorization,
    payer: fcl.currentUser().authorization,
    authorizations: [fcl.currentUser().authorization],
    limit: 999,
  });

  const sealed = await fcl.tx(transactionId).onceSealed();
  if (sealed.status !== 4) throw new Error(`tx_status_${sealed.status}`);
  return transactionId;
}

export { CONTRACT_ADDRESS as PRACTICE_CREDENTIAL_ADDRESS };
