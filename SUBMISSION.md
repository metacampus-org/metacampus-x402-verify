# metaCAMPUS x402 Standard Entry — submission notes

**Project:** [metacampus-x402-verify](https://github.com/metacampus-org/metacampus-x402-verify)  
**Challenge:** [Algorand Global x402 Challenge](https://algorand.co/global-x402-challenge)  
**Tag:** `x402-global-challenge` (Bazaar / leaderboard filter: `X402-GLOBAL-CHALLENGE`)

## Problem

Agents need a machine-payable way to **verify credentials** without API keys or accounts. metaCAMPUS exposes credential-hash verification as an **x402-paid HTTPS API**: unpaid callers get **HTTP 402** with payment requirements; after MainNet USDC settlement via **GoPlausible**, the verify handler runs.

## What to demo

| Step | Expected |
| --- | --- |
| Unpaid `POST /v1/credential/verify` | **HTTP 402** + `paymentRequirements` (exact scheme, MainNet, USDC ASA **31566704**, `extra.tag: x402-global-challenge`, Bazaar / merchant extensions) |
| Paid request (x402 client or facilitator settle) | **200** JSON verify result (`valid`, `hash`, …) |
| Health | Free `GET /health` |

### Unpaid curl (local or HTTPS)

```bash
curl -si -X POST https://YOUR_HOST/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

### Paid path

Use `@x402/fetch` + `@x402/avm` against the public HTTPS URL (see README). Facilitator: https://facilitator.goplausible.xyz — guide: https://facilitator.goplausible.xyz/guide

Local-only mock (not for challenge credit):

```bash
# ALLOW_MOCK_PAYMENT=true
curl -s -X POST http://localhost:4021/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -H 'X-PAYMENT: mock' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

## Network / asset / discovery

- **Network:** Algorand MainNet (`algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=`)
- **USDC ASA:** `31566704` (6 decimals)
- **Facilitator:** GoPlausible `https://facilitator.goplausible.xyz`
- **Challenge tag:** `x402-global-challenge` in `paymentRequirements.extra.tag`
- **Bazaar:** `declareDiscoveryExtension` + `x402-merchant` on the paid route

## Env (production)

Minimum for a real settle:

```bash
X402_PAY_TO=<MainNet Algorand address opted into USDC 31566704>
FACILITATOR_URL=https://facilitator.goplausible.xyz
ALGORAND_NETWORK=mainnet
USDC_ASA=31566704
X402_CHALLENGE_TAG=x402-global-challenge
ALLOW_MOCK_PAYMENT=false
```

Full list: [`.env.example`](./.env.example) and [README](./README.md#environment).

## Deploy (HTTPS required)

Facilitator Doctor, Bazaar refresh, and challenge tracking need a **public HTTPS** base URL.

- Prefer **Railway** or **Fly.io** (`npm run build` → `npm start`; see README Deploy notes / `Dockerfile` / `Procfile`).
- After deploy: unpaid curl → confirm **402** + tag + discovery extensions.

## Electric Capital / challenge submit

After HTTPS is live and **one** MainNet USDC payment has settled into `X402_PAY_TO`:

1. Confirm USDC received on the merchant wallet.
2. Confirm Bazaar resource under **X402-GLOBAL-CHALLENGE**.
3. Follow Algorand submit guide: https://algorand.co/blog/the-x402-global-challenge-is-live-how-to-build-submit-your-entry
4. Materials to include:
   - Repo: `https://github.com/metacampus-org/metacampus-x402-verify`
   - Public HTTPS verify URL
   - Demo video: https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view (Metacampus.mp4)

## Human next steps (blockers for “done”)

1. Set real MainNet **`X402_PAY_TO`** (USDC ASA `31566704` opted in).
2. Deploy public **HTTPS**.
3. Complete **one real settle** (not mock) via GoPlausible; confirm USDC + Bazaar listing.
4. Submit / notify Electric Capital with repo + HTTPS URL + [demo video](https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view).

## Demo video

**Metacampus.mp4:** https://drive.google.com/file/d/1G789QVUFMOTKkMTlcoXe3GHM2r7CZGvU/view
