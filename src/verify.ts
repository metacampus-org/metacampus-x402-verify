/**
 * Credential verify handler (paid path).
 *
 * The metaBADGE gate (src/badge-gate.ts) runs before payment. This handler
 * only runs after a verified gate AND a settled (or mock) payment.
 */

import type { BadgeGateResult } from "./badge-gate.js";

export type VerifyRequest = {
  hash: string;
  credentialId?: string;
  issuerId?: string;
  agentId?: string;
  attestation?: string;
  txRef?: string;
};

export type VerifyResponse = {
  /** "verified" after gate + payment; never "unverified" from this handler. */
  status: "verified";
  valid: boolean;
  hash: string;
  anchoredHash?: string;
  txId?: string;
  reason?: string;
  credentialId?: string;
  issuerId?: string;
  agentId?: string;
  attestation?: string;
  network?: string;
  verifiedAt: string;
  payment: "paid";
};

const HASH_RE = /^[a-fA-F0-9]{16,128}$/;

export function verifyCredential(
  body: unknown,
  opts?: {
    paymentTxId?: string;
    network?: string;
    badgeGate?: BadgeGateResult;
  },
): VerifyResponse {
  const verifiedAt = new Date().toISOString();

  if (!body || typeof body !== "object") {
    return {
      status: "verified",
      valid: false,
      hash: "",
      reason: "Request body must be a JSON object",
      payment: "paid",
      verifiedAt,
    };
  }

  const req = body as VerifyRequest;
  const hash = typeof req.hash === "string" ? req.hash.trim().toLowerCase() : "";

  if (!hash || !HASH_RE.test(hash)) {
    return {
      status: "verified",
      valid: false,
      hash,
      reason: "Invalid hash format (expect 16–128 hex chars)",
      payment: "paid",
      verifiedAt,
    };
  }

  const gate = opts?.badgeGate;
  const anchoredHash = hash;
  const txId = opts?.paymentTxId || req.txRef || undefined;

  return {
    status: "verified",
    valid: true,
    hash: anchoredHash,
    anchoredHash,
    txId,
    credentialId: gate?.credentialId ?? req.credentialId,
    issuerId: gate?.issuerId ?? req.issuerId,
    agentId: gate?.agentId ?? req.agentId,
    attestation: gate?.badge?.attestation ?? req.attestation,
    network: opts?.network,
    verifiedAt,
    payment: "paid",
  };
}
