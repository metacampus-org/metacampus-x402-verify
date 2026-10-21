# Example settle client (unlisted-first)

Pay `POST /v1/credential/verify` on MainNet **without** waiting for a Bazaar listing. GoPlausible catalogs the route on the **first successful settle** when the 402 includes the `bazaar` extension (already live).

**Live URL:** https://metacampus-x402-verify.vercel.app/v1/credential/verify  
**Price:** $0.01 USDC (ASA `31566704`) · **Tag:** `x402-global-challenge`

## Prereqs

1. Buyer MainNet account opted into USDC ASA `31566704`
2. ≥ `0.01` USDC on that account (facilitator pays gas)
3. Local Node ≥ 20

**No private keys in git.** Use a local `.env` only.

## Path A — CLI (`@x402/fetch` + key/mnemonic)

```bash
cd examples/settle-client
cp env.example .env
# set AVM_PRIVATE_KEY=…  OR  AVM_MNEMONIC="25 words …"
npm install
npm run settle
```

Optional env: `VERIFY_URL`, `CREDENTIAL_HASH` (see `env.example`).

Convert mnemonic → `AVM_PRIVATE_KEY` (88-char base64) if you prefer (from GoPlausible guide):

```bash
AVM_MNEMONIC="your 25 words here" npx -y -p algosdk node -e 'const a=require("algosdk"); console.log(Buffer.from(a.mnemonicToSecretKey(process.env.AVM_MNEMONIC).sk).toString("base64"))'
```

## Path B — Pera / Lute browser wallet

See [`pera-wallet.md`](./pera-wallet.md): `ClientAvmSigner` = `{ address, signTransactions }` from `@txnlab/use-wallet-react`. Wire WalletManager + Buffer shim in a Vite app (GoPlausible [client-web](https://github.com/GoPlausible/.github/tree/main/profile/algorand-x402-documentation/bazaar-global-hackathon-examples/client-web)).

Universal Client Bazaar browse will **not** show this resource until after the first settle — use Path A/B (or MCP “buy a URL you already know”) for that first payment.

## After settle

1. Confirm USDC on merchant `payTo` (`I4ZBH6…` — see repo README)
2. Recheck discovery / Doctor BAZAAR badge
3. Report tx id back to CoS

## References

- https://facilitator.goplausible.xyz/guide
- https://facilitator.goplausible.xyz/guide/use
- https://dev.algorand.co/resources/x402-on-algorand/
- https://github.com/algorandfoundation/x402-demo/blob/main/x402-basic-tutorial/client/index.ts
