# metacampus-x402-verify

**metaCAMPUS** paid HTTPS API for agentic **credential verification**, built for the [Algorand Global x402 Challenge](https://algorand.co/global-x402-challenge).

## Competition status (judges)

**Live HTTPS API:** [https://metacampus-x402-verify.vercel.app](https://metacampus-x402-verify.vercel.app)  
**Merchant payTo (public):** `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE`  
**Status:** Competition-ready for visibility — unpaid **402** smoke is green. **One real MainNet GoPlausible settle** remains open (then Bazaar / leaderboard).

```bash
curl -s https://metacampus-x402-verify.vercel.app/health | jq
curl -s https://metacampus-x402-verify.vercel.app/ | jq
curl -si -X POST https://metacampus-x402-verify.vercel.app/v1/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"hash":"a1b2c3d4e5f6789012345678abcdef01"}'
```

Full docs: see README body below restore commit, and [SUBMISSION.md](./SUBMISSION.md).

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

## Challenge checklist

- [x] Scaffold Express + `@x402/*` middleware (402 unpaid → paid handler)
- [x] MainNet CAIP-2 + USDC ASA `31566704` defaults
- [x] GoPlausible `FACILITATOR_URL` hooks
- [x] `extra.tag: "x402-global-challenge"`
- [x] Bazaar discovery extension + merchant identity
- [x] MainNet **`X402_PAY_TO`**: `I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE`
- [x] Public **HTTPS** on Hobby: https://metacampus-x402-verify.vercel.app
- [ ] **Remaining:** one real MainNet settle via GoPlausible (USDC lands in payTo)
- [ ] Confirm listing in Bazaar + leaderboard (`SOURCE=X402-GLOBAL-CHALLENGE`)
- [x] Challenge form submitted; re-notify with HTTPS URL after first settle if needed

See [SUBMISSION.md](./SUBMISSION.md) for deploy env, smoke curls, and human next steps. Full README restore in next commit if truncated.

## License

MIT — see [LICENSE](./LICENSE).
