import "dotenv/config";

/** CAIP-2 network id used by x402 (`namespace:reference`). */
export type Caip2Network = `${string}:${string}`;

/** Algorand MainNet CAIP-2 (genesis hash). */
export const ALGORAND_MAINNET_CAIP2 =
  "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=" as const satisfies Caip2Network;

/** Algorand TestNet CAIP-2. */
export const ALGORAND_TESTNET_CAIP2 =
  "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=" as const satisfies Caip2Network;

export const USDC_MAINNET_ASA = "31566704";
export const USDC_TESTNET_ASA = "10458941";
export const USDC_DECIMALS = 6;

const networkEnv = (process.env.ALGORAND_NETWORK || "mainnet").toLowerCase();

export const isMainnet = networkEnv !== "testnet";

function resolveNetwork(): Caip2Network {
  const override = process.env.ALGORAND_CAIP2?.trim();
  if (override && override.includes(":")) {
    return override as Caip2Network;
  }
  return isMainnet ? ALGORAND_MAINNET_CAIP2 : ALGORAND_TESTNET_CAIP2;
}

export const networkCaip2: Caip2Network = resolveNetwork();

export const usdcAsa =
  process.env.USDC_ASA || (isMainnet ? USDC_MAINNET_ASA : USDC_TESTNET_ASA);

/** Merchant receiving address (payTo). Prefer X402_PAY_TO, fall back to AVM_ADDRESS. */
export const payTo =
  process.env.X402_PAY_TO?.trim() || process.env.AVM_ADDRESS?.trim() || "";

export const priceUsdc = parseFloat(process.env.X402_PRICE_USDC || "0.01");

/** Atomic USDC amount string for PaymentRequirements.amount */
export function priceAtomicUnits(): string {
  const atomic = Math.round(priceUsdc * 10 ** USDC_DECIMALS);
  return String(atomic);
}

/** Dollar-string price for @x402 middleware (e.g. "$0.01"). */
export function priceDollarString(): string {
  return `$${priceUsdc.toFixed(2)}`;
}

export const facilitatorUrl =
  process.env.FACILITATOR_URL?.trim() ||
  process.env.GOPLAUSIBLE_FACILITATOR_URL?.trim() ||
  "https://facilitator.goplausible.xyz";

export const challengeTag =
  process.env.X402_CHALLENGE_TAG?.trim() || "x402-global-challenge";

export const allowMockPayment =
  (process.env.ALLOW_MOCK_PAYMENT || "false").toLowerCase() === "true";

export const port = Number(process.env.PORT || 4021);
export const host = process.env.HOST || "0.0.0.0";

export const merchant = {
  name: process.env.MERCHANT_NAME || "metaCAMPUS Credential Verify",
  website: process.env.MERCHANT_WEBSITE || "https://metacampus.org",
  logo: process.env.MERCHANT_LOGO || "",
  categories: (process.env.MERCHANT_CATEGORIES ||
    "api,algorand,x402,credentials,education")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export function assertPayToConfigured(): void {
  if (!payTo) {
    console.warn(
      "[x402] X402_PAY_TO / AVM_ADDRESS not set — 402 responses use a placeholder payTo. Set a MainNet merchant address before real settlements.",
    );
  }
}
