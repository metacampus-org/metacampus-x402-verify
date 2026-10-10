# AC — Agentic Credentialing splash

Source for the `/ac` route on https://metacampus-on-algorand.grok.me.

The grok.me app (project `01a0f042-d48a-7d13-8c24-40fbe46735a4`) is not this API. Drop `index.html` in as `/ac` in that build. This file does not serve `POST /v1/credential/verify`.

Planned Vercel host, not created yet: `https://metacampus-x402-verify.vercel.app`

- `GET /health`
- `POST /v1/credential/verify` (expect HTTP 402 until a real settle)

Do not point the marketing site at grok.me for the paid route.

Powered by [xAI](https://x.ai).
