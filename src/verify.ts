/**
 * Credential verify handler (paid path).
 * Mock-OK scaffolding: when no on-chain / registry backend is wired,
 * a well-formed hash request returns valid=true.
 */

export type VerifyRequest = {
  hash: string;
  credentialId?: string;
  issuerId?: string;
  txRef?: string;
};

export type VerifyResponse = {
  valid: boolean;
  hash: string;
  anchoredHash?: string;
  txId?: string;
  reason?: string;
  credentialId?: string;
  issuerId?: string;
  network?: string;
  verifiedAt: string;
};

const HASH_RE = /^[a-fA-F0-9]{16,128}$/;

export function verifyCredential(
  body: unknown,
  opts?: { paymentTxId?: string; network?: string },
): VerifyResponse {
  const verifiedAt = new Date().toISOString();

  if (!body || typeof body !== "object") {
    return {
      valid: false,
      hash: "",
      reason: "Request body must be a JSON object",
      verifiedAt,
    };
  }

  const { hash, credentialId, issuerId, txRef } = body as VerifyRequest;

  if (!hash || typeof hash !== "string") {
    return {
      valid: false,
      hash: "",
      reason: "Missing required field: hash (hex string)",
      verifiedAt,
    };
  }

  if (!HASH_RE.test(hash)) {
    return {
      valid: false,
      hash,
      reason: "Invalid hash format (expect 16–128 hex chars)",
      verifiedAt,
    };
  }

  // Scaffolding: mock OK. Wire Algorand box/app or registry lookup here.
  const anchoredHash = hash.toLowerCase();
  const txId = opts?.paymentTxId || txRef || undefined;

  return {
    valid: true,
    hash: anchoredHash,
    anchoredHash,
    txId,
    credentialId,
    issuerId,
    network: opts?.network,
    verifiedAt,
  };
}
