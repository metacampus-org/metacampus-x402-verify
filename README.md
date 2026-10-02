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
