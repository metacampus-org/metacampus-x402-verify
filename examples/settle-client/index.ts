/**
 * Unlisted-first MainNet settle for metaCAMPUS x402 verify.
 *
 * Bazaar listing is NOT required to pay — hit the known HTTPS URL with an
 * x402 client. After one successful settle, GoPlausible auto-catalogs the route.
 *
 * Signer (pick one in .env — never commit secrets):
 *   AVM_PRIVATE_KEY  — 88-char base64 (seed||pubkey), or
 *   AVM_MNEMONIC     — 25-word Algorand mnemonic
 *
 * Payer needs MainNet USDC ASA 31566704 opt-in + ≥ $0.01 USDC.
 * Facilitator (GoPlausible) pays gas via feePayer on the 402.
 *
 * For Pera / Lute in a browser dApp, see pera-wallet.md.
 */
import { config } from "dotenv";
import { mnemonicToSecretKey } from "algosdk";
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { toClientAvmSigner, ExactAvmScheme } from "@x402/avm";

config();

/** Full MainNet CAIP-2 as returned by our live 402 (not the truncated @x402/avm short form). */
const MAINNET =
  "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=" as const;
/** Full TestNet CAIP-2 from the GoPlausible guide. */
const TESTNET =
  "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=" as const;

const DEFAULT_VERIFY_URL =
  "https://metacampus-x402-verify.vercel.app/v1/credential/verify";

const DEFAULT_HASH = "a1b2c3d4e5f6789012345678abcdef01";

function privateKeyFromMnemonic(mnemonic: string): string {
  const { sk } = mnemonicToSecretKey(mnemonic.trim());
  // algosdk sk is 64 bytes (seed + pubkey) — same encoding toClientAvmSigner expects.
  return Buffer.from(sk).toString("base64");
}

function resolvePrivateKeyBase64(): string {
  const fromEnv = process.env.AVM_PRIVATE_KEY?.trim();
  if (fromEnv) {
    if (fromEnv.length !== 88) {
      console.warn(
        `[warn] AVM_PRIVATE_KEY length is ${fromEnv.length}; GoPlausible expects 88 base64 chars (64 raw bytes).`,
      );
    }
    return fromEnv;
  }
  const mnemonic = process.env.AVM_MNEMONIC?.trim();
  if (mnemonic) {
    return privateKeyFromMnemonic(mnemonic);
  }
  throw new Error(
    "Set AVM_PRIVATE_KEY (base64) or AVM_MNEMONIC in examples/settle-client/.env — see env.example. Never commit secrets.",
  );
}

async function main(): Promise<void> {
  const testnet = (process.env.X402_NETWORK || "").toLowerCase() === "testnet";
  const verifyUrl =
    process.env.VERIFY_URL?.trim() ||
    (testnet ? "" : DEFAULT_VERIFY_URL);
  if (testnet && !verifyUrl) {
    throw new Error(
      "TestNet settle needs VERIFY_URL set to the Preview POST /v1/testnet/credential/verify URL. Refusing to call the production MainNet route.",
    );
  }
  if (
    testnet &&
    verifyUrl.includes("metacampus-x402-verify.vercel.app") &&
    !verifyUrl.includes("/v1/testnet/")
  ) {
    throw new Error(
      "Refusing to send a TestNet payment to the production MainNet verify URL.",
    );
  }
  const hash = process.env.CREDENTIAL_HASH?.trim() || DEFAULT_HASH;
  const key = resolvePrivateKeyBase64();
  const network = testnet ? TESTNET : MAINNET;

  const signer = toClientAvmSigner(key);
  console.log(`Buyer address: ${signer.address}`);
  console.log(`network=${testnet ? "testnet" : "mainnet"}`);
  console.log(`POST ${verifyUrl}`);
  console.log(`hash=${hash}`);

  const client = new x402Client().register(
    network,
    new ExactAvmScheme(signer),
  );
  const paidFetch = wrapFetchWithPayment(fetch, client);

  const response = await paidFetch(verifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }),
  });

  const settleMeta = new x402HTTPClient(client).getPaymentSettleResponse(
    (name) => response.headers.get(name),
  );
  if (settleMeta) {
    console.log("\nPayment settle:", JSON.stringify(settleMeta, null, 2));
  }

  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep raw */
  }

  if (!response.ok) {
    console.error(`\nRequest failed: HTTP ${response.status}`);
    console.error(body);
    process.exit(1);
  }

  console.log("\nVerify response:", JSON.stringify(body, null, 2));
  console.log(
    "\nNext: confirm USDC on merchant payTo, then GET https://facilitator.goplausible.xyz/discovery/resources?limit=50 and search metacampus / your resource URL.",
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Settle error:", message);
  process.exit(1);
});
