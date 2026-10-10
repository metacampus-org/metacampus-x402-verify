/**
 * mC transfer-intent handler (paid path).
 * Settlement currency is MainNet USDC via x402.
 * mC itself is a TestNet pilot ASA — this route does not move mC on-chain
 * and never holds freeze/clawback keys.
 */

export type McTransferIntentRequest = {
  /** Algorand address that will receive mC (must opt in on TestNet). */
  to: string;
  /** Whole units of mC (decimals = 0). */
  amount: number | string;
  /** Optional Algorand address expected to send (informational). */
  from?: string;
  /** Optional free-text note (truncated). */
  note?: string;
};

export type McTransferIntentResponse = {
  ok: boolean;
  intent: "mc-transfer";
  networkMc: string;
  mcAsaId: string;
  mcUnitName: string;
  mcName: string;
  to?: string;
  from?: string;
  amount?: number;
  note?: string;
  paymentTxId?: string;
  paymentNetwork?: string;
  paymentAsset: string;
  status: "intent_recorded" | "rejected";
  nextSteps?: string[];
  reason?: string;
  recordedAt: string;
  explorerAsset?: string;
};

/** TestNet vanity ASA documented in metacampus-dao/ASSETS.md */
export const MC_TESTNET_ASA_ID = "773957514";
export const MC_TESTNET_CAIP2 =
  "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";
export const MC_UNIT = "mC";
export const MC_NAME = "metaCAMPUS mC Token";
export const MC_TOTAL = 1_000_000;
export const MC_DECIMALS = 0;

const ADDR_RE = /^[A-Z2-7]{58}$/;

export function buildMcTransferIntent(
  body: unknown,
  opts?: {
    paymentTxId?: string;
    paymentNetwork?: string;
    mcAsaId?: string;
  },
): McTransferIntentResponse {
  const recordedAt = new Date().toISOString();
  const mcAsaId = opts?.mcAsaId || MC_TESTNET_ASA_ID;

  const base = {
    intent: "mc-transfer" as const,
    networkMc: MC_TESTNET_CAIP2,
    mcAsaId,
    mcUnitName: MC_UNIT,
    mcName: MC_NAME,
    paymentTxId: opts?.paymentTxId,
    paymentNetwork: opts?.paymentNetwork,
    paymentAsset: "USDC",
    recordedAt,
    explorerAsset: `https://lora.algokit.io/testnet/asset/${mcAsaId}`,
  };

  if (!body || typeof body !== "object") {
    return {
      ...base,
      ok: false,
      status: "rejected",
      reason: "Request body must be a JSON object with to and amount",
    };
  }

  const { to, amount, from, note } = body as McTransferIntentRequest;

  if (!to || typeof to !== "string" || !ADDR_RE.test(to.trim())) {
    return {
      ...base,
      ok: false,
      status: "rejected",
      reason: "Missing or invalid field: to (58-char Algorand address)",
    };
  }

  const amountNum =
    typeof amount === "string" ? Number(amount.trim()) : Number(amount);
  if (
    !Number.isFinite(amountNum) ||
    !Number.isInteger(amountNum) ||
    amountNum < 1 ||
    amountNum > MC_TOTAL
  ) {
    return {
      ...base,
      ok: false,
      status: "rejected",
      reason: `amount must be an integer from 1 to ${MC_TOTAL} (mC decimals=0)`,
    };
  }

  if (from !== undefined && from !== null && from !== "") {
    if (typeof from !== "string" || !ADDR_RE.test(from.trim())) {
      return {
        ...base,
        ok: false,
        status: "rejected",
        reason: "Invalid field: from (58-char Algorand address)",
      };
    }
  }

  const noteStr =
    typeof note === "string" ? note.trim().slice(0, 128) : undefined;

  return {
    ...base,
    ok: true,
    status: "intent_recorded",
    to: to.trim(),
    from: from && String(from).trim() ? String(from).trim() : undefined,
    amount: amountNum,
    note: noteStr || undefined,
    nextSteps: [
      "Recipient opts in to TestNet ASA " + mcAsaId,
      "Holder signs an AssetTransfer of amount mC to `to` on TestNet",
      "Optional: manager may freeze/clawback only under pilot policy",
      "This API never signs mC transfers; USDC payment only records intent",
    ],
  };
}
