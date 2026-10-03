# TestNet path (does not change MainNet)

The GoPlausible guide does **not** ask you to run your own facilitator node. There is no payment infrastructure to host. “Install” means the `@x402/*` packages already in this app, talking to the hosted facilitator.

**Facilitator:** https://facilitator.goplausible.xyz (`POST /verify`, `POST /settle`, `GET /supported`)

**Production** `POST /v1/credential/verify` stays Algorand MainNet USDC ASA `31566704` and `X402_PAY_TO`. Do not set `ALGORAND_NETWORK=testnet` on Production.

## Separate route

`POST /v1/testnet/credential/verify`

- Enabled only when **Preview** env `X402_TESTNET_PAY_TO` is a public TestNet address
- That address must be opted into TestNet USDC ASA **`10458941`**
- It must **not** be the MainNet payTo
- No private key or mnemonic in git or Vercel
- No `x402-global-challenge` tag on this route
- If the env is unset, the path returns **404** and the MainNet route is unchanged

## Preview access (before you pay)

1. Vercel Authentication on Preview returns **401** / a sign-in redirect until that protection is opened for the TestNet client (or disabled for that Preview). Opening it is a Vercel project setting — not a code change.
2. Even after auth is open, `POST /v1/testnet/credential/verify` stays **404** until Preview has `X402_TESTNET_PAY_TO` set to a public TestNet merchant address (never the MainNet `I4ZBH6…` payTo).

## What you do for one TestNet payment

1. Create a TestNet buyer account (Pera TestNet, or a key that never leaves your machine).
2. Fund it: ALGO from the [TestNet dispenser](https://bank.testnet.algorand.network/) (minimum balance: 0.1 ALGO plus 0.1 ALGO for the USDC opt-in). USDC from the [Circle faucet](https://faucet.circle.com/) (Algorand TestNet).
3. Opt the buyer **and** the TestNet merchant address into ASA `10458941`.
4. On the Vercel **Preview** only, set `X402_TESTNET_PAY_TO` to that merchant address. Leave Production unset.
5. Point an x402 client at the preview URL (not the production MainNet URL):

```bash
cd examples/settle-client
cp env.example .env
# local only — buyer key, never Vercel
# AVM_PRIVATE_KEY=...
VERIFY_URL=https://<preview>.vercel.app/v1/testnet/credential/verify \
X402_NETWORK=testnet \
npm run settle
```

The settle client sends the TestNet CAIP-2 `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=` when `X402_NETWORK=testnet`.

Guide: https://facilitator.goplausible.xyz/guide
