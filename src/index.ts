/**
 * metaCAMPUS x402 paid credential verification API
 * Algorand Global x402 Challenge — MainNet USDC via GoPlausible facilitator
 *
 * Unpaid → HTTP 402 with x402 paymentRequirements + Bazaar discovery
 * Paid   → mock credential verify (scaffold; wire registry later)
 */
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactAvmScheme } from "@x402/avm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import {
  assertPayToConfigured,
  challengeTag,
  facilitatorUrl,
  host,
  merchant,
  networkCaip2,
  payTo,
  port,
  priceAtomicUnits,
  priceDollarString,
  usdcAsa,
  allowMockPayment,
  USDC_DECIMALS,
} from "./config.js";
import { verifyCredential } from "./verify.js";

assertPayToConfigured();

const PLACEHOLDER_PAY_TO =
  "METACAMPUSX402PAYTOPLACEHOLDERAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const merchantPayTo = payTo || PLACEHOLDER_PAY_TO;

const facilitator = new HTTPFacilitatorClient({
  url: facilitatorUrl,
});

const resourceServer = new x402ResourceServer(facilitator).register(
  networkCaip2,
  new ExactAvmScheme(),
);

const verifyExampleOutput = {
  valid: true,
  hash: "a1b2c3d4e5f6789012345678abcdef01",
  anchoredHash: "a1b2c3d4e5f6789012345678abcdef01",
  txId: "PAYMENT_TX_ID_ON_SETTLE",
  verifiedAt: "2026-01-01T00:00:00.000Z",
};

/** POST body discovery (bodyType required so method enum is POST/PUT/PATCH). */
const bazaarExt = declareDiscoveryExtension({
  bodyType: "json",
  input: {
    hash: "a1b2c3d4e5f6789012345678abcdef01",
    credentialId: "cred_example",
    issuerId: "issuer_example",
  },
  inputSchema: {
    type: "object",
    properties: {
      hash: { type: "string", description: "Credential content hash (hex)" },
      credentialId: { type: "string" },
      issuerId: { type: "string" },
      txRef: { type: "string" },
    },
    required: ["hash"],
  },
  output: { example: verifyExampleOutput },
});

const paidRoutes = {
  "POST /v1/credential/verify": {
    accepts: [
      {
        scheme: "exact" as const,
        network: networkCaip2,
        price: priceDollarString(),
        payTo: merchantPayTo,
        extra: {
          tag: challengeTag,
          decimals: USDC_DECIMALS,
          name: "USDC",
          asa: usdcAsa,
          amountAtomic: priceAtomicUnits(),
        },
      },
    ],
    description:
      "metaCAMPUS agentic credential verification — pay USDC on Algorand, verify a credential hash",
    mimeType: "application/json",
    extensions: {
      ...bazaarExt,
      "x402-merchant": {
        info: {
          name: merchant.name,
          website: merchant.website,
          ...(merchant.logo ? { logo: merchant.logo } : {}),
          categories: merchant.categories,
        },
        schema: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            website: { type: "string" },
            logo: { type: "string" },
            categories: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
};

const app = express();

app.use(express.json({ limit: "256kb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-PAYMENT, X-PAYMENT-RESPONSE, PAYMENT-SIGNATURE",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "metacampus-x402-verify",
    network: networkCaip2,
    usdcAsa,
    price: priceDollarString(),
    priceAtomic: priceAtomicUnits(),
    payToConfigured: Boolean(payTo),
    facilitator: facilitatorUrl,
    challengeTag,
    allowMockPayment,
  });
});

app.get("/", (_req, res) => {
  res.json({
    name: "metaCAMPUS x402 Credential Verify",
    challenge: challengeTag,
    endpoints: {
      health: "GET /health",
      verify: "POST /v1/credential/verify (x402 paid)",
    },
    docs: "https://github.com/metacampus-org/metacampus-x402-verify",
    facilitator: facilitatorUrl,
  });
});

function handleVerify(
  req: express.Request,
  res: express.Response,
  paymentTxId?: string,
): void {
  const result = verifyCredential(req.body, {
    paymentTxId,
    network: networkCaip2,
  });

  if (
    !result.valid &&
    (result.reason?.startsWith("Missing") ||
      result.reason?.startsWith("Invalid hash") ||
      result.reason?.includes("JSON object"))
  ) {
    res.status(400).json(result);
    return;
  }

  res.status(200).json(result);
}

/**
 * Dev-only mock payment bypass (ALLOW_MOCK_PAYMENT=true).
 * Must respond here and NOT call next() — otherwise paymentMiddleware 402s.
 */
if (allowMockPayment) {
  app.post("/v1/credential/verify", (req, res, next) => {
    const payment = req.header("X-PAYMENT") || req.header("PAYMENT-SIGNATURE");
    if (payment === "mock") {
      handleVerify(req, res, "mock-local-settle");
      return;
    }
    next();
  });
}

app.use(
  paymentMiddleware(
    paidRoutes as Parameters<typeof paymentMiddleware>[0],
    resourceServer,
  ),
);

app.post("/v1/credential/verify", (req, res) => {
  handleVerify(req, res);
});

/** Default export so Vercel detects Express at `src/index.ts`. */
export default app;

/** Local / Docker / Procfile: listen. On Vercel, skip listen (Fluid Function). */
if (!process.env.VERCEL) {
  app.listen(port, host, () => {
    console.log(
      `[metacampus-x402-verify] listening on http://${host}:${port}`,
    );
    console.log(`  network=${networkCaip2}`);
    console.log(
      `  usdcAsa=${usdcAsa} price=${priceDollarString()} (${priceAtomicUnits()} atomic)`,
    );
    console.log(`  payTo=${merchantPayTo.slice(0, 8)}…`);
    console.log(`  facilitator=${facilitatorUrl}`);
    console.log(`  tag=${challengeTag}`);
    if (allowMockPayment) {
      console.log(`  ALLOW_MOCK_PAYMENT=true (X-PAYMENT: mock)`);
    }
  });
}
