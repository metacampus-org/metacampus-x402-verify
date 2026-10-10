# TestNet path (does not change MainNet)

The GoPlausible guide does **not** ask you to run your own facilitator node. There is no payment infrastructure to host. “Install” means the `@x402/*` packages already in this app, talking to the hosted facilitator.

**Facilitator:** https://facilitator.goplausible.xyz (`POST /verify`, `POST /settle`, `GET /supported`)

**Production** `POST /v1/credential/verify` stays Algorand MainNet USDC ASA `31566704` and `X402_PAY_TO`. Do not set `ALGORAND_NETWORK=testnet` on Production.

## Separate route

`POST /v1/testnet/credential/verify`

- Enabled only when **Preview** env `X402_TESTNET_PAY_TO` is a public Algorand address used as the TestNet merchant
- That address must be opted into TestNet USDC ASA **`10458941`** on TestNet (addresses are network-agnostic; the same string as MainNet `X402_PAY_TO` is allowed when that opt-in is present)
- Opt-in to ASA `10458941` is what matters, not a different address string
- No private key or mnemonic in git or Vercel
- No `x402-global-challenge` tag on this route
- If the env is unset, the path returns **404** and the MainNet route is unchanged
- Do not claim the route can settle until the merchant address’s TestNet opt-in to ASA `10458941` is confirmed

## Preview access (before you pay)

1. **Do not** put this x402 TestNet route behind Vercel Authentication. Preview protection for this path must stay off so clients hit the app, not a Vercel login. That is a Vercel project setting — not a code change. Do not turn protection back on for this route.
2. With protection off and `X402_TESTNET_PAY_TO` set, an unauthenticated unpaid `POST /v1/testnet/credential/verify` returns **402** from the app (payment required), not a Vercel **401**.
3. If Preview `X402_TESTNET_PAY_TO` is unset, the path returns **404**. Production MainNet `POST /v1/credential/verify` stays unchanged.

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
