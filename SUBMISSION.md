# metaCAMPUS x402 Standard Entry — submission notes

**Project:** [metacampus-x402-verify](https://github.com/metacampus-org/metacampus-x402-verify)  
**Challenge:** [Algorand Global x402 Challenge](https://algorand.co/global-x402-challenge)  
**Tag:** `x402-global-challenge` (Bazaar / leaderboard filter: `X402-GLOBAL-CHALLENGE`)

## Competition status

**Live API:** [https://metacampus-x402-verify.vercel.app](https://metacampus-x402-verify.vercel.app) · **payTo:** `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE`  
**Ready:** HTTPS + unpaid 402 smoke green. **Open:** one real MainNet GoPlausible settle (known URL; Bazaar not required first) → then Bazaar/leaderboard.

```bash
curl -s https://metacampus-x402-verify.vercel.app/health | jq
curl -si -X POST https://metacampus-x402-verify.vercel.app/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

## Problem

Agents need a machine-payable way to **verify credentials** without API keys or accounts. metaCAMPUS exposes credential-hash verification as an **x402-paid HTTPS API**: unpaid callers get **HTTP 402** with payment requirements; after MainNet USDC settlement via **GoPlausible**, the verify handler runs.

## What to demo

| Step | Expected |
| --- | --- |
| Unpaid `POST /v1/credential/verify` | **HTTP 402** + `paymentRequirements` (exact scheme, MainNet, USDC ASA **31566704**, `extra.tag: x402-global-challenge`, Bazaar / merchant extensions) |
| Paid request (x402 client or facilitator settle) | **200** JSON verify result (`valid`, `hash`, …) |
| Health | Free `GET /health` (includes public `url` + `payTo`) |

### Unpaid curl (local or HTTPS)

```bash
curl -si -X POST https://metacampus-x402-verify.vercel.app/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

### Paid path

Use `@x402/fetch` + `@x402/avm` (or MCP) against the public HTTPS URL — see [Unlisted first settle](#unlisted-first-settle-bazaar-not-required) and README. Facilitator: https://facilitator.goplausible.xyz — guide: https://facilitator.goplausible.xyz/guide

Local-only mock (not for challenge credit):

```bash
# ALLOW_MOCK_PAYMENT=true
curl -s -X POST http://localhost:4021/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -H 'X-PAYMENT: mock' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

## Unlisted first settle (Bazaar not required)

Listing in GoPlausible Bazaar / Universal Client browse happens **after** the first successful MainNet settle. Pay the known URL directly — do not wait for discovery.

**Payer prereqs:** MainNet account · USDC ASA **`31566704`** opt-in · ≥ `$0.01` USDC.

**Request:**

```bash
# Unpaid probe (expect 402) — then settle with an x402 client (not plain curl)
curl -si -X POST https://metacampus-x402-verify.vercel.app/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

**Settle clients:**

1. `@x402/fetch` + `@x402/avm` (`ExactAvmScheme`) — Node key **or** Pera/Lute via `ClientAvmSigner` / `@txnlab/use-wallet` ([guide](https://facilitator.goplausible.xyz/guide)).
2. MCP `make_http_request_with_x402` against the same URL ([Use x402](https://facilitator.goplausible.xyz/guide/use)).

**Not for first pay:** [Universal Client](https://facilitator.goplausible.xyz/client) Bazaar browse (works only after cataloging).

After settle: confirm USDC in payTo → Bazaar / leaderboard under **X402-GLOBAL-CHALLENGE**.

## Network / asset / discovery

- **Network:** Algorand MainNet (`algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=`)
- **USDC ASA:** `31566704` (6 decimals)
- **Facilitator:** GoPlausible `https://facilitator.goplausible.xyz`
- **Challenge tag:** `x402-global-challenge` in `paymentRequirements.extra.tag`
- **Bazaar:** `declareDiscoveryExtension` + `x402-merchant` on the paid route
- **Merchant payTo:** `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE`

## Env (production)

```bash
X402_PAY_TO=I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE
FACILITATOR_URL=https://facilitator.goplausible.xyz
ALGORAND_NETWORK=mainnet
USDC_ASA=31566704
X402_CHALLENGE_TAG=x402-global-challenge
ALLOW_MOCK_PAYMENT=false
X402_PRICE_USDC=0.01
MERCHANT_NAME=metaCAMPUS Credential Verify
MERCHANT_WEBSITE=https://metacampus-on-algorand.grok.me
MERCHANT_CATEGORIES=api,algorand,x402,credentials,education
```

Full list: [`.env.example`](./.env.example) and [README](./README.md#environment). No private keys in git or Vercel env.

## Deploy (HTTPS required)

Facilitator Doctor, Bazaar refresh, and challenge tracking need a **public HTTPS API** base URL.

**https://metacampus-on-algorand.grok.me is marketing only** — it is not the x402 API host. Deploy this repo to **Vercel** (preferred) or Railway/Fly.

### Vercel Hobby checklist

| Step | Detail |
| --- | --- |
| Tier | **Hobby (free)** — `vercel.json` `maxDuration: 60` is within Hobby limits |
| GitHub link | Connect Vercel GitHub App to `metacampus-org` (empty Hobby team / import 403 = App not linked) |
| Import | [vercel.com/new](https://vercel.com/new) → `metacampus-org/metacampus-x402-verify` |
| Env (Production) | See table in [README Deploy](./README.md#deploy): `X402_PAY_TO=I4ZBH6…`, `ALLOW_MOCK_PAYMENT=false`, MainNet, ASA `31566704`, facilitator, tag, `MERCHANT_*` — **no private keys** |
| Deploy | **Live:** [https://metacampus-x402-verify.vercel.app](https://metacampus-x402-verify.vercel.app) |
| Smoke | Unpaid curl below → **HTTP 402** + tag + payTo |

### Vercel step-by-step

1. Connect GitHub → Vercel, then [vercel.com/new](https://vercel.com/new) → Import `metacampus-org/metacampus-x402-verify` on Hobby.
2. Set Production env from the table in [README Deploy](./README.md#deploy) (`X402_PAY_TO`, `ALLOW_MOCK_PAYMENT=false`, MainNet USDC / facilitator / tag / merchant).
3. ~~Deploy~~ → live `https://metacampus-x402-verify.vercel.app` (Vercel redeploys from `main`).
4. Unpaid curl (above) → expect **402** + tag + payTo.
5. GoPlausible Doctor + one real MainNet settle.

Repo includes `vercel.json` + Express `export default app` (no `listen` on Vercel) + `trust proxy` so payment-required `resource.url` is https. Human/CoS creates the Vercel project after GitHub App link; docs are import-ready.

Alternatives: Railway / Fly — see README. `Dockerfile` / `Procfile` unchanged.

## Electric Capital / challenge submit

Challenge **form already submitted**. After HTTPS is live and **one** MainNet USDC payment has settled into `X402_PAY_TO`:

1. Confirm USDC received on the merchant wallet.
2. Confirm Bazaar resource under **X402-GLOBAL-CHALLENGE**.
3. Update / re-notify with the live HTTPS verify URL if the form needs it: https://algorand.co/blog/the-x402-global-challenge-is-live-how-to-build-submit-your-entry
4. Materials:
   - Repo: `https://github.com/metacampus-org/metacampus-x402-verify`
   - Public HTTPS verify URL: https://metacampus-x402-verify.vercel.app
   - Demo video: https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view (Metacampus.mp4)

## Human next steps (blockers for “done”)

1. ~~payTo documented~~ `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE` · ~~HTTPS~~ https://metacampus-x402-verify.vercel.app · ~~unpaid 402~~ green.
2. **Do now:** one real MainNet settle via GoPlausible against the known verify URL (not mock; Bazaar browse not required); confirm USDC + Bazaar / leaderboard.
3. Re-notify Electric Capital / entry with live HTTPS URL if needed + [demo video](https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view).

## Demo video

**Metacampus.mp4:** https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view
