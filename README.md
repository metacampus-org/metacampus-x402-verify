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

### Paid (real x402 client)

Use an `@x402/fetch` (or `@x402/axios`) client with an Algorand signer funded in USDC, pointed at your deployed HTTPS URL. The GoPlausible guide: https://facilitator.goplausible.xyz/guide

Example shape (client not shipped in this repo):

```ts
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { toClientAvmSigner } from "@x402/avm";
import { ExactAvmScheme } from "@x402/avm/exact/client";

const MAINNET = "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";
const client = new x402Client().register(
  MAINNET,
  new ExactAvmScheme(toClientAvmSigner(process.env.AVM_PRIVATE_KEY!)),
);
const paidFetch = wrapFetchWithPayment(fetch, client);
const res = await paidFetch("https://metacampus-x402-verify.vercel.app/v1/credential/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ hash: "a1b2c3d4e5f6789012345678abcdef01" }),
});
console.log(await res.json());
```

**Never commit private keys.** Keep `AVM_PRIVATE_KEY` in local/CI secrets only.

---

## API

### `POST /v1/credential/verify` (paid)

**Request**

```json
{
  "hash": "a1b2c3d4e5f6789012345678abcdef01",
  "credentialId": "optional",
  "issuerId": "optional",
  "txRef": "optional"
}
```

**Response (scaffold / mock OK)**

```json
{
  "valid": true,
  "hash": "a1b2c3d4e5f6789012345678abcdef01",
  "anchoredHash": "a1b2c3d4e5f6789012345678abcdef01",
  "txId": "…",
  "credentialId": "optional",
  "issuerId": "optional",
  "network": "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
  "verifiedAt": "2026-09-30T00:00:00.000Z"
}
```

`valid: false` includes a `reason` string. Wire a real registry / box storage lookup in `src/verify.ts` when ready.

### `GET /health` (free)

Service config summary (no secrets). Live responses include public `url` (https) and `payTo` when set — same on `GET /`.

---

## Environment

See [`.env.example`](./.env.example).

| Variable | Purpose |
| --- | --- |
| `X402_PAY_TO` / `AVM_ADDRESS` | Merchant receive address (MainNet; must opt in to USDC) |
| `X402_PRICE_USDC` | Price in USDC human units (default `0.01`) |
| `ALGORAND_NETWORK` | `mainnet` (default) or `testnet` |
| `USDC_ASA` | Default MainNet `31566704` |
| `FACILITATOR_URL` | Default `https://facilitator.goplausible.xyz` |
| `X402_CHALLENGE_TAG` | Default `x402-global-challenge` |
| `ALLOW_MOCK_PAYMENT` | Local only: accept `X-PAYMENT: mock` |
| `MERCHANT_*` | Bazaar / `x402-merchant` identity |

---

## Deploy

Needs a public **HTTPS** API URL for facilitator Doctor, Bazaar refresh, and challenge tracking.

> **Marketing site ≠ API host.** https://metacampus-on-algorand.grok.me is the product / landing site only. It does **not** serve `POST /v1/credential/verify`. Deploy this repo to **Vercel** (or Railway/Fly) for the paid API.

Repo wiring for Vercel is already in tree: `export default app` in `src/index.ts` (skips `listen` when `VERCEL` is set), `app.set("trust proxy", 1)` so x402 `resource.url` is **https**, + [`vercel.json`](./vercel.json) (`maxDuration` 60s — **Hobby-safe**; Hobby allows up to 300s).

**Live Hobby URL:** https://metacampus-x402-verify.vercel.app

**Hobby free-tier checklist (before Import works):**

1. On Vercel, connect the **GitHub App** to `metacampus-org` (or the account that owns the repo). Empty Hobby team / `create_git_project` 403 usually means GitHub is not linked yet.
2. Import `metacampus-org/metacampus-x402-verify` on Hobby (no Pro features required).
3. Set Production env from the table below (`ALLOW_MOCK_PAYMENT=false`; **no private keys**).
4. Deploy → use the real `*.vercel.app` URL Vercel prints (do not invent one).
5. Unpaid smoke curl → expect **402** (commands below).

### Vercel (recommended — one-click from GitHub)

1. Open [vercel.com/new](https://vercel.com/new) (Hobby) and **Import** `metacampus-org/metacampus-x402-verify` — requires GitHub↔Vercel connected first.
2. Framework preset: leave default / Other. Root directory: `.` Build Command: `npm run build` (or leave Vercel auto). Output is unused for this Express entry — Vercel runs `src/index.ts` as a Function.
3. **Environment Variables** (Production) — paste before first deploy:

| Name | Value |
| --- | --- |
| `X402_PAY_TO` | `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE` |
| `ALLOW_MOCK_PAYMENT` | `false` |
| `ALGORAND_NETWORK` | `mainnet` |
| `USDC_ASA` | `31566704` |
| `FACILITATOR_URL` | `https://facilitator.goplausible.xyz` |
| `X402_CHALLENGE_TAG` | `x402-global-challenge` |
| `X402_PRICE_USDC` | `0.01` |
| `MERCHANT_NAME` | `metaCAMPUS Credential Verify` |
| `MERCHANT_WEBSITE` | `https://metacampus-on-algorand.grok.me` |
| `MERCHANT_CATEGORIES` | `api,algorand,x402,credentials,education` |

Do **not** add private keys / mnemonics. Settlement goes through GoPlausible; `X402_PAY_TO` is a public receive address only.

4. Deploy → HTTPS host is live: `https://metacampus-x402-verify.vercel.app` (redeploy after git push).
5. **Smoke test (unpaid → 402):**

```bash
curl -si -X POST https://metacampus-x402-verify.vercel.app/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

Expect `HTTP/1.1 402` (or `402`) with x402 `paymentRequirements`, `extra.tag: x402-global-challenge`, USDC ASA `31566704`, and `payTo` matching `X402_PAY_TO`.

6. Optional: `GET https://metacampus-x402-verify.vercel.app/health` → `ok: true`, `payToConfigured: true`.
7. Paste the verify URL into GoPlausible Doctor, then run **one** real MainNet settle with an x402 client.

Live project create / Vercel login is a human/CoS step; this repo is import-ready once env is set.

### Railway

1. New project from this GitHub repo.
2. Build = `npm run build`, Start = `npm start` (or `Dockerfile` / `Procfile`).
3. Set the same env vars as the Vercel table (`PORT` is injected by Railway).
4. HTTPS domain → unpaid `curl` (expect 402).

### Fly.io

```bash
fly launch --name metacampus-x402-verify --no-deploy
fly secrets set X402_PAY_TO=I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE \
  FACILITATOR_URL=https://facilitator.goplausible.xyz \
  ALLOW_MOCK_PAYMENT=false ALGORAND_NETWORK=mainnet USDC_ASA=31566704 \
  X402_CHALLENGE_TAG=x402-global-challenge
fly deploy
```

Then unpaid `curl` against the Fly HTTPS URL (expect 402).

---

## Unlisted first settle (Bazaar not required)

Bazaar / Universal Client **browse** listing appears only **after** the first successful MainNet settle. You do **not** need to be listed to pay — hit the known HTTPS URL with any x402 client.

**Prereqs (payer wallet):**

1. Algorand MainNet account with enough ALGO for min-balance (facilitator sponsors per-payment fees).
2. Opted into USDC ASA **`31566704`**.
3. Enough MainNet USDC for the route price (`$0.01` → `10000` microUSDC).

**Target:**

```text
POST https://metacampus-x402-verify.vercel.app/v1/credential/verify
Content-Type: application/json
{"hash":"a1b2c3d4e5f6789012345678abcdef01"}
```

### Option A — `@x402/fetch` (Node) or Pera via wallet signer

Same shape as [Paid (real x402 client)](#paid-real-x402-client): `wrapFetchWithPayment` + `ExactAvmScheme` on MainNet CAIP-2.

- **Node / script:** fund a MainNet key as `AVM_PRIVATE_KEY` (never commit) and point `paidFetch` at the URL above.
- **Browser + Pera / Lute:** pass `ClientAvmSigner` `{ address, signTransactions }` from `@txnlab/use-wallet` into `ExactAvmScheme` (see [GoPlausible guide — Wallet as the signer](https://facilitator.goplausible.xyz/guide)). Keys stay in the wallet.

Reference client: [algorandfoundation/x402-demo](https://github.com/algorandfoundation/x402-demo/blob/main/x402-basic-tutorial/client/index.ts) (switch TestNet → MainNet + ASA `31566704`).

### Option B — Agent / MCP (URL you already know)

Use GoPlausible’s `make_http_request_with_x402` against the verify URL (no Bazaar search). Guide: [Use x402](https://facilitator.goplausible.xyz/guide/use).

### After settle

1. Confirm USDC landed in payTo `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE`.
2. Recheck Bazaar / merchant discovery + leaderboard (`SOURCE=X402-GLOBAL-CHALLENGE`).
3. [Universal Client](https://facilitator.goplausible.xyz/client) can find the resource via Bazaar **only after** that first settle — do not rely on it for the initial payment.

Official background: [challenge build & submit](https://algorand.co/blog/the-x402-global-challenge-is-live-how-to-build-submit-your-entry), [facilitator get started](https://facilitator.goplausible.xyz/guide).

---

## Bazaar discovery

Route config includes:

1. `declareDiscoveryExtension({ input, output })` — catalogs the resource after the **first successful MainNet settle**.
2. `x402-merchant` — name / website / categories.
3. `extra.tag: "x402-global-challenge"` — challenge leaderboard attribution.

Doctor: paste your HTTPS verify URL at the facilitator Doctor (see https://facilitator.goplausible.xyz/guide).

---

## Electric Capital / challenge submit

After HTTPS is live and **one** MainNet payment has settled:

1. Confirm USDC in `X402_PAY_TO`.
2. Confirm Bazaar resource + merchant under filter **X402-GLOBAL-CHALLENGE**.
3. Follow Algorand’s submission guide: https://algorand.co/blog/the-x402-global-challenge-is-live-how-to-build-submit-your-entry  
4. If Electric Capital / Devrel asks for a repo URL, use:  
   `https://github.com/metacampus-org/metacampus-x402-verify`

---

## Scripts

| Script | |
| --- | --- |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | `node dist/index.js` |
| `npm run dev` | `tsx watch src/index.ts` |

---

## What works vs TODO (MainNet payment)

| Works in this scaffolding | Still TODO for humans |
| --- | --- |
| 402 unpaid via `@x402/express` + Exact AVM scheme | Fund + opt-in MainNet payTo wallet to USDC |
| Challenge tag + Bazaar + merchant extensions + Vercel wiring | Human: create Vercel project + first settle |
| GoPlausible facilitator client URL | One real settle with an x402 client |
| Mock verify response after payment / mock header | Replace mock verify with on-chain / registry truth |
| `npm install` + `npm run build` | Leaderboard + Electric Capital submit |

### Exact next human steps

1. Confirm merchant `X402_PAY_TO` `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE` is opted into USDC ASA `31566704`.
2. ~~Import / deploy HTTPS~~ → live: https://metacampus-x402-verify.vercel.app (redeploy picks up `main`).
3. ~~Unpaid smoke~~ → 402 confirmed; after `trust proxy` redeploy, confirm `resource.url` is `https://…`.
4. One real paid settle via GoPlausible against the **known URL** (see [Unlisted first settle](#unlisted-first-settle-bazaar-not-required); Bazaar browse not required) → confirm USDC + Bazaar / leaderboard.
5. Re-notify Electric Capital / update entry with the live HTTPS verify URL if needed (form already submitted).

---

## License

MIT — see [LICENSE](./LICENSE).

## References

- https://facilitator.goplausible.xyz/guide
- https://x402.goplausible.xyz/
- https://algorand.co/global-x402-challenge
- https://docs.x402.org/core-concepts/network-and-token-support

## Demo video

Product demo (Metacampus.mp4):

https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view

Use this link in challenge / Electric Capital submission materials alongside the public HTTPS URL and GitHub repo.
