# metacampus-x402-verify

**metaCAMPUS** paid HTTPS API for agentic **credential verification**, built for the [Algorand Global x402 Challenge](https://algorand.co/global-x402-challenge).

Unpaid requests receive **HTTP 402** with x402 `paymentRequirements` (Algorand MainNet USDC). Settled payments are verified through the **GoPlausible** facilitator. After payment, `POST /v1/credential/verify` returns a credential-hash check result.

> This is a **thin, separate** service from the TestNet Next.js MVP (`easy-a-hackathon`). It is intentionally scaffolding-first for the challenge.

| | |
| --- | --- |
| **Org repo** | https://github.com/metacampus-org/metacampus-x402-verify |
| **Network** | Algorand MainNet (`algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=`) |
| **Asset** | USDC ASA `31566704` (6 decimals) |
| **Facilitator** | https://facilitator.goplausible.xyz |
| **Challenge tag** | `x402-global-challenge` |
| **Paid route** | `POST /v1/credential/verify` |
| **API host (Hobby)** | https://metacampus-x402-verify.vercel.app |
| **Demo video** | [Metacampus.mp4](https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view) |

---

## Competition status (judges)

**Live HTTPS API:** [https://metacampus-x402-verify.vercel.app](https://metacampus-x402-verify.vercel.app)  
**Merchant payTo (public):** `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE`  
**Status:** Competition-ready for visibility — unpaid **402** smoke is green. **One real MainNet GoPlausible settle** remains open (Bazaar listing follows that settle — see [Unlisted first settle](#unlisted-first-settle-bazaar-not-required)).

```bash
# Health (free) — returns url + payTo when configured
curl -s https://metacampus-x402-verify.vercel.app/health | jq

# Root discovery (free)
curl -s https://metacampus-x402-verify.vercel.app/ | jq

# Unpaid verify → HTTP 402 (MainNet USDC ASA 31566704, tag x402-global-challenge, https resource.url)
curl -si -X POST https://metacampus-x402-verify.vercel.app/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

Repo: https://github.com/metacampus-org/metacampus-x402-verify · Demo: [Metacampus.mp4](https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view)

---

## Challenge checklist

- [x] Scaffold Express + `@x402/*` middleware (402 unpaid → paid handler)
- [x] MainNet CAIP-2 + USDC ASA `31566704` defaults
- [x] GoPlausible `FACILITATOR_URL` hooks
- [x] `extra.tag: "x402-global-challenge"`
- [x] Bazaar discovery extension (`declareDiscoveryExtension`) + merchant identity
- [x] Env: `X402_PAY_TO` / `AVM_ADDRESS`, price, ASA, facilitator
- [x] MainNet **`X402_PAY_TO`** merchant address documented (set in host env; opted into USDC `31566704`): `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE`
- [x] Public **HTTPS** on Hobby: [https://metacampus-x402-verify.vercel.app](https://metacampus-x402-verify.vercel.app) (see [Deploy](#deploy))
- [ ] **Remaining:** one real MainNet settle via GoPlausible (USDC lands in payTo)
- [ ] Confirm listing in Bazaar + leaderboard (`SOURCE=X402-GLOBAL-CHALLENGE`)
- [x] Challenge form submitted (Electric Capital / entry form); re-notify with HTTPS URL after first settle if needed

---

## Quick start

```bash
cp .env.example .env
# set X402_PAY_TO=<your MainNet Algorand address>
npm install
npm run build
npm start
# or: npm run dev
```

Health (free):

```bash
curl -s http://localhost:4021/health | jq
```

### Unpaid → HTTP 402

```bash
curl -si -X POST http://localhost:4021/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

Expect `HTTP/1.1 402 Payment Required` and a JSON body with x402 payment requirements (`scheme: exact`, MainNet network, USDC amount, `payTo`, `extra.tag: x402-global-challenge`, Bazaar extensions).

### Paid (local mock only)

For local smoke tests without chain:

```bash
# .env → ALLOW_MOCK_PAYMENT=true
curl -s -X POST http://localhost:4021/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -H 'X-PAYMENT: mock' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01","credentialId":"cred_1"}' | jq
```

**Never commit private keys.** Keep `AVM_PRIVATE_KEY` in local/CI secrets only.

Full API, env table, Vercel/Railway/Fly deploy steps, Bazaar, and Electric Capital notes: see [SUBMISSION.md](./SUBMISSION.md) (competition-ready).

### Paid (real x402 client)

Use an `@x402/fetch` client with an Algorand signer funded in USDC against https://metacampus-x402-verify.vercel.app — guide: https://facilitator.goplausible.xyz/guide — and [Unlisted first settle](#unlisted-first-settle-bazaar-not-required).

## API

### `POST /v1/credential/verify` (paid)

Request: `{ "hash": "…", "credentialId"?: "…", "issuerId"?: "…", "txRef"?: "…" }`

Response (scaffold): `{ valid, hash, anchoredHash, txId, network, verifiedAt, … }` — `valid: false` includes `reason`.

### `GET /health` (free)

Service config summary (no secrets). Live responses include public `url` (https) and `payTo` when set — same on `GET /`.

## Environment

See [`.env.example`](./.env.example). Key Production vars: `X402_PAY_TO`, `ALLOW_MOCK_PAYMENT=false`, `ALGORAND_NETWORK=mainnet`, `USDC_ASA=31566704`, `FACILITATOR_URL`, `X402_CHALLENGE_TAG`, `X402_PRICE_USDC`, `MERCHANT_*`. **No private keys** in git or Vercel env.

## Deploy

**Marketing site ≠ API host.** https://metacampus-on-algorand.grok.me is landing only. API: **https://metacampus-x402-verify.vercel.app**

Repo wiring: `export default app` + skip `listen` on `VERCEL`, `trust proxy`, [`vercel.json`](./vercel.json) `maxDuration: 60` (Hobby-safe). Full env/Vercel steps: [SUBMISSION.md](./SUBMISSION.md).

**Smoke (unpaid → 402):**

```bash
curl -si -X POST https://metacampus-x402-verify.vercel.app/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

Then one real MainNet settle — see below.

## Unlisted first settle (Bazaar not required)

Bazaar / Universal Client **browse** listing appears only **after** the first successful MainNet settle. You do **not** need to be listed to pay — hit the known HTTPS URL with any x402 client.

**Prereqs (payer):** MainNet account · USDC ASA **`31566704`** opt-in · ≥ `$0.01` USDC. Facilitator sponsors fees.

**Target:** `POST https://metacampus-x402-verify.vercel.app/v1/credential/verify` with `{"hash":"…"}`.

### Option A — `@x402/fetch` (Node) or Pera via wallet signer

Runnable example (no secrets in git): [`examples/settle-client`](./examples/settle-client).

```bash
cd examples/settle-client
cp env.example .env   # AVM_PRIVATE_KEY or AVM_MNEMONIC locally only
npm install && npm run settle
```

`wrapFetchWithPayment` + `ExactAvmScheme` on MainNet CAIP-2 `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=`.

- **Node / script:** `AVM_PRIVATE_KEY` or `AVM_MNEMONIC` (never commit) → `npm run settle`.
- **Browser + Pera / Lute:** sketch in [`examples/settle-client/pera-wallet.md`](./examples/settle-client/pera-wallet.md) (`ClientAvmSigner` from `@txnlab/use-wallet`, [Wallet as the signer](https://facilitator.goplausible.xyz/guide)).

Reference: [algorandfoundation/x402-demo client](https://github.com/algorandfoundation/x402-demo/blob/main/x402-basic-tutorial/client/index.ts) (MainNet + ASA `31566704`).

### Option B — Agent / MCP (URL you already know)

`make_http_request_with_x402` against the verify URL ([Use x402](https://facilitator.goplausible.xyz/guide/use)).

### After settle

1. Confirm USDC in payTo `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE`.
2. Recheck Bazaar / leaderboard (`SOURCE=X402-GLOBAL-CHALLENGE`).
3. [Universal Client](https://facilitator.goplausible.xyz/client) works via Bazaar **only after** that first settle.

More detail: [SUBMISSION.md — Unlisted first settle](./SUBMISSION.md#unlisted-first-settle-bazaar-not-required).

## Exact next human steps

1. Confirm payTo opted into USDC `31566704`.
2. ~~HTTPS~~ live · ~~unpaid 402~~ green.
3. One real paid settle against the **known URL** (Bazaar browse not required) → USDC + Bazaar / leaderboard.
4. Re-notify Electric Capital with live HTTPS URL if needed + [demo](https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view).

## License

MIT — see [LICENSE](./LICENSE).

## References

- https://facilitator.goplausible.xyz/guide
- https://algorand.co/global-x402-challenge
- https://docs.x402.org/core-concepts/network-and-token-support
