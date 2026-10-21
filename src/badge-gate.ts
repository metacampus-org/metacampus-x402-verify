/**
 * Pre-payment metaBADGE gate.
 *
 * Runs before x402 settlement. If the badge does not exist, or issuer /
 * attestation / agent assignment fails, the request is rejected as
 * "unverified" and payment is never offered. Only a full pass returns
 * "verified" and allows the request to continue into the payment middleware.
 *
 * This is a mock registry. Wire an Algorand app-state / indexer lookup
 * (demo-repository AlgorandService.verifyBadge shape) behind
 * BADGE_REGISTRY_URL or an in-process adapter without changing the gate
 * contract.
 */

export type MetaBadge = {
  hash: string;
  credentialId: string;
  issuerId: string;
  agentId: string;
  attestation: string;
  skill?: string;
  issuedAt?: string;
};

export type BadgeGateRequest = {
  hash?: string;
  credentialId?: string;
  issuerId?: string;
  agentId?: string;
  attestation?: string;
};

export type BadgeGateStatus = "verified" | "unverified";

export type BadgeGateResult = {
  status: BadgeGateStatus;
  /** True only when the hash is present in the registry. */
  exists: boolean;
  issuerOk: boolean;
  attestationOk: boolean;
  agentOk: boolean;
  reason?: string;
  hash?: string;
  credentialId?: string;
  issuerId?: string;
  agentId?: string;
  badge?: MetaBadge;
};

const HASH_RE = /^[a-fA-F0-9]{16,128}$/;

/**
 * In-memory fixture registry used until the demo-repository issuance
 * contract is live and the relay can read badge state.
 *
 * Fixture (passes all checks):
 *   hash:        a1b2c3d4e5f6789012345678abcdef01
 *   credentialId: cred_example
 *   issuerId:    issuer_example
 *   agentId:     agent_example
 *   attestation: skill-verified
 */
const MOCK_BADGES: ReadonlyMap<string, MetaBadge> = new Map([
  [
    "a1b2c3d4e5f6789012345678abcdef01",
    {
      hash: "a1b2c3d4e5f6789012345678abcdef01",
      credentialId: "cred_example",
      issuerId: "issuer_example",
      agentId: "agent_example",
      attestation: "skill-verified",
      skill: "agentic-credentialing",
      issuedAt: "2026-10-01T00:00:00.000Z",
    },
  ],
  [
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    {
      hash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      credentialId: "cred_other",
      issuerId: "issuer_other",
      agentId: "agent_other",
      attestation: "skill-verified-other",
      skill: "other-skill",
      issuedAt: "2026-10-02T00:00:00.000Z",
    },
  ],
]);

function asObject(body: unknown): BadgeGateRequest | null {
  if (!body || typeof body !== "object") return null;
  return body as BadgeGateRequest;
}

function matchField(
  provided: string | undefined,
  expected: string,
): boolean {
  if (provided === undefined || provided === null || provided === "") {
    return false;
  }
  return provided.trim() === expected;
}

/**
 * Check whether a metaBADGE exists and matches issuer, attestation, and
 * assigned agent. Does not touch payment.
 */
export function checkMetaBadge(body: unknown): BadgeGateResult {
  const req = asObject(body);
  if (!req) {
    return {
      status: "unverified",
      exists: false,
      issuerOk: false,
      attestationOk: false,
      agentOk: false,
      reason: "Request body must be a JSON object",
    };
  }

  const hash = typeof req.hash === "string" ? req.hash.trim().toLowerCase() : "";
  if (!hash) {
    return {
      status: "unverified",
      exists: false,
      issuerOk: false,
      attestationOk: false,
      agentOk: false,
      reason: "Missing required field: hash",
    };
  }
  if (!HASH_RE.test(hash)) {
    return {
      status: "unverified",
      exists: false,
      issuerOk: false,
      attestationOk: false,
      agentOk: false,
      hash,
      reason: "Invalid hash format (expect 16–128 hex chars)",
    };
  }

  const badge = MOCK_BADGES.get(hash);
  if (!badge) {
    return {
      status: "unverified",
      exists: false,
      issuerOk: false,
      attestationOk: false,
      agentOk: false,
      hash,
      reason: "metaBADGE does not exist",
    };
  }

  const issuerOk = matchField(req.issuerId, badge.issuerId);
  const attestationOk = matchField(req.attestation, badge.attestation);
  const agentOk = matchField(req.agentId, badge.agentId);

  if (!issuerOk || !attestationOk || !agentOk) {
    const missing: string[] = [];
    if (!issuerOk) missing.push("issuer");
    if (!attestationOk) missing.push("attestation");
    if (!agentOk) missing.push("agent");
    return {
      status: "unverified",
      exists: true,
      issuerOk,
      attestationOk,
      agentOk,
      hash,
      credentialId: badge.credentialId,
      issuerId: badge.issuerId,
      agentId: badge.agentId,
      reason: `metaBADGE exists but failed check: ${missing.join(", ")}`,
      badge,
    };
  }

  return {
    status: "verified",
    exists: true,
    issuerOk: true,
    attestationOk: true,
    agentOk: true,
    hash,
    credentialId: badge.credentialId,
    issuerId: badge.issuerId,
    agentId: badge.agentId,
    badge,
  };
}

/** Fixture list for local tests. Not a public route. */
export function listMockBadges(): MetaBadge[] {
  return Array.from(MOCK_BADGES.values());
}
