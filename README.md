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
| **Demo video** | [Metacampus.mp4](https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view) |

---

## Challenge checklist

- [x] Scaffold Express + `@x402/*` middleware (402 unpaid → paid handler)
- [x] MainNet CAIP-2 + USDC ASA `31566704` defaults
- [x] GoPlausible `FACILITATOR_URL` hooks
- [x] `extra.tag: "x402-global-challenge"`
- [x] Bazaar discovery extension (`declareDiscoveryExtension`) + merchant identity
- [x] Env: `X402_PAY_TO` / `AVM_ADDRESS`, price, ASA, facilitator
- [ ] Set real **MainNet** `X402_PAY_TO` wallet (opted into USDC `31566704`)
- [ ] Deploy public **HTTPS** endpoint (Railway / Fly / Vercel)
- [ ] Complete **one** real MainNet settle via GoPlausible (USDC lands in payTo)
- [ ] Confirm listing in Bazaar + leaderboard (`SOURCE=X402-GLOBAL-CHALLENGE`)
- [ ] Submit / note for Electric Capital (see below)

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
const res = await paidFetch("https://YOUR_HOST/v1/credential/verify", {
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

Service config summary (no secrets).

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

## Deploy notes

Needs a public **HTTPS** URL for facilitator Doctor, Bazaar refresh, and challenge tracking.

### Railway

1. New project from this GitHub repo.
2. Root start: `npm run build && npm start` (or set Build = `npm run build`, Start = `npm start`).
3. Set env: `X402_PAY_TO`, `FACILITATOR_URL`, `ALGORAND_NETWORK=mainnet`, `PORT` (Railway injects).
4. Generate HTTPS domain → probe with unpaid `curl` (expect 402).

### Fly.io

```bash
fly launch --name metacampus-x402-verify --no-deploy
# Dockerfile or use Node buildpack; set secrets:
fly secrets set X402_PAY_TO=… FACILITATOR_URL=https://facilitator.goplausible.xyz
fly deploy
```

### Vercel

Express on Vercel works via a serverless wrapper or long-running alternative (Railway/Fly preferred for a simple always-on 402 API). If using Vercel, export the Express app and add `vercel.json` rewrites; ensure unpaid requests still return **402 before** body validation.

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
| Challenge tag + Bazaar + merchant extensions | Deploy HTTPS |
| GoPlausible facilitator client URL | One real settle with an x402 client |
| Mock verify response after payment / mock header | Replace mock verify with on-chain / registry truth |
| `npm install` + `npm run build` | Leaderboard + Electric Capital submit |

### Exact next human steps

1. Create/fund MainNet Algorand address → opt in ASA `31566704` → set `X402_PAY_TO`.
2. Deploy this repo to Railway/Fly with HTTPS.
3. `curl` unpaid → confirm 402 + tag + bazaar.
4. Run one paid client call → confirm USDC received + Bazaar listing.
5. Submit challenge entry / notify Electric Capital with the public repo + HTTPS URL.

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
