/**
 * attestPracticeOnChain — user-initiated Flow write for verified practice.
 *
 * Keys stay client-side (Privacy Policy: "all blockchain transactions are
 * user-initiated and cryptographically signed"). Requires the
 * PracticeCredential contract deployed (cadence/contracts/PracticeCredential.cdc)
 * and VITE_PRACTICE_CREDENTIAL_ADDRESS set. Throws on any failure — callers
 * decide how to present it (useAttestation keeps the honest "queued" state).
 *
 * Security: the transaction includes a `verifierSignature` co-signed by the
 * Brume backend (an authorized verifier). The contract checks this signature
 * on-chain, so a user cannot self-issue without backend verification.
 */
import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";

const CONTRACT_ADDRESS = import.meta.env.VITE_PRACTICE_CREDENTIAL_ADDRESS as string | undefined;
const VERIFIER_ADDRESS = (import.meta.env.VITE_BRUME_VERIFIER_ADDRESS as string | undefined) ?? CONTRACT_ADDRESS;

interface VerifierSignature {
  verifier_address: string;
  verifier_signature_hex: string;
  signed_data_hex: string;
}

export async function attestPracticeOnChain(args: {
  sessionId: string;
  score: number;
  verifierSignature?: VerifierSignature | null;
}): Promise<string> {
  if (!CONTRACT_ADDRESS) throw new Error("credential_contract_not_configured");

  const user = await fcl.currentUser().snapshot();
  if (!user.loggedIn) throw new Error("wallet_not_connected");

  // Decode the verifier co-signature (hex → byte array for Cadence [UInt8]).
  const sigBytes = hexToBytes(args.verifierSignature?.verifier_signature_hex ?? "");
  const dataBytes = hexToBytes(args.verifierSignature?.signed_data_hex ?? "");
  const verifierAddr = args.verifierSignature?.verifier_address ?? VERIFIER_ADDRESS;

  const cadence = `
    import PracticeCredential from ${CONTRACT_ADDRESS}

    transaction(
      sessionId: String,
      score: UFix64,
      verifier: Address,
      verifierSignature: [UInt8],
      signedData: [UInt8]
    ) {
      prepare(signer: auth(Storage) &Account) {
        if signer.storage.borrow<&PracticeCredential.Collection>(from: PracticeCredential.CollectionStoragePath) == nil {
          signer.storage.save(<- PracticeCredential.createEmptyCollection(), to: PracticeCredential.CollectionStoragePath)
        }
        let collection = signer.storage.borrow<&PracticeCredential.Collection>(from: PracticeCredential.CollectionStoragePath)
          ?? panic("Could not borrow credential collection")
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
  `;

  const transactionId = await fcl.mutate({
    cadence,
    args: (arg, types) => [
      arg(args.sessionId, types.String),
      arg(args.score.toFixed(2), types.UFix64),
      arg(verifierAddr, types.Address),
      arg(sigBytes, types.Array(types.UInt8)),
      arg(dataBytes, types.Array(types.UInt8)),
    ],
    // @ts-expect-error — @onflow/fcl 1.21.10 ships no type declarations;
    // these methods exist at runtime (verified).
    proposer: fcl.currentUser().authorization,
    // @ts-expect-error
    payer: fcl.currentUser().authorization,
    // @ts-expect-error
    authorizations: [fcl.currentUser().authorization],
    limit: 999,
  });

  // @ts-expect-error — fcl.tx exists at runtime
  const sealed = await fcl.tx(transactionId).onceSealed();
  if (sealed.status !== 4) throw new Error(`tx_status_${sealed.status}`);
  return transactionId;
}

/** Convert a hex string to a number[] for Cadence [UInt8] args. */
function hexToBytes(hex: string): number[] {
  if (!hex) return [];
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return bytes;
}

export { CONTRACT_ADDRESS as PRACTICE_CREDENTIAL_ADDRESS };
