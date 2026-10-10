# TestNet instance — metaCAMPUS x402 verify

**Branch:** `testnet`  
**Purpose:** Separate HTTPS host for Algorand **TestNet** x402 smoke (USDC ASA `10458941`), without changing MainNet production.

| | Production (`main`) | This instance (`testnet`) |
| --- | --- | --- |
| Network | MainNet | **TestNet** |
| USDC ASA | `31566704` | **`10458941`** |
| CAIP-2 | `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=` | `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=` |
| payTo | `I4ZBH6RZ…55BVE` | same address string on **TestNet** |
| Facilitator | GoPlausible | GoPlausible |
| mC ASA | reference only | TestNet **`773957514`** |

## Required env (Vercel project for this branch or a second project)

```bash
ALGORAND_NETWORK=testnet
USDC_ASA=10458941
X402_PAY_TO=I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE
X402_PRICE_USDC=0.01
FACILITATOR_URL=https://facilitator.goplausible.xyz
X402_CHALLENGE_TAG=x402-global-challenge
ALLOW_MOCK_PAYMENT=false
MC_ASA_ID=773957514
MERCHANT_NAME=metaCAMPUS Credential Verify (TestNet)
MERCHANT_WEBSITE=https://metacampus-on-algorand.grok.me
```

## Deploy options

1. **Preferred:** New Vercel project `metacampus-x402-verify-testnet` linked to this repo, Production Branch = `testnet`, env as above.
2. **Alternative:** Same project, Preview env vars scoped to git branch `testnet` (do **not** set TestNet vars on Production).

After deploy, expected host pattern:

- Second project: `https://metacampus-x402-verify-testnet.vercel.app`
- Preview: `https://metacampus-x402-verify-git-testnet-*.vercel.app` (team slug varies)

## Smoke

```bash
curl -sS https://<TESTNET-HOST>/health | jq .
# expect network TestNet CAIP-2, usdcAsa 10458941

curl -i -X POST https://<TESTNET-HOST>/v1/credential/verify \
  -H 'content-type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
# expect HTTP 402, asset 10458941
```

Pera client (connect wallet): https://facilitator.goplausible.xyz/client — set **TestNet**.

## Status (2026-10-10)

- Code on `testnet` branch is ready (same as `main` + this doc).
- Vercel **project create** from CoS connector returned **403** (no permission to create project / env on team).
- Human: create the Vercel project or branch Preview env in the dashboard, then paste the live URL back for probe.
