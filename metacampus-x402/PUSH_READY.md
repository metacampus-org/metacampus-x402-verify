# Push-ready note (for GitHub teammate)

Repo already created (public): **https://github.com/metacampus-org/metacampus-x402-verify**

Local tree at `/workspace/metacampus-x402-verify` is scaffolding-complete:

- `npm install` + `npm run build` succeed
- Unpaid `POST /v1/credential/verify` → **HTTP 402** with MainNet USDC ASA `31566704`, amount `10000`, `extra.tag=x402-global-challenge`, Bazaar + merchant extensions
- `ALLOW_MOCK_PAYMENT=true` + `X-PAYMENT: mock` → **200** mock verify JSON
- No secrets / private keys in tree

**Commit & push** (exclude `node_modules/`, `dist/`, `.env` — already in `.gitignore`):

Suggested paths to include:
`.gitignore`, `.env.example`, `LICENSE`, `README.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `Dockerfile`, `Procfile`, `src/**`, `PUSH_READY.md` (optional)

Do **not** invent secrets. Human still must set `X402_PAY_TO`, deploy HTTPS, one MainNet settle.

**grok deploy swarm:** not found on this box (only `/workspace/grok-mcp-connector` + `/workspace/grok-mcp-client`).
