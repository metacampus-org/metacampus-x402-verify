/**
 * metaCAMPUS x402 paid API
 * Algorand Global x402 Challenge — MainNet USDC via GoPlausible facilitator
 *
 * Routes:
 *   POST /v1/credential/verify     — credential hash check (USDC)
 *   POST /v1/mc/transfer-intent    — record mC transfer intent (USDC fee;
 *                                    mC is TestNet pilot ASA, not payment asset)
 *
 * Unpaid → HTTP 402 with x402 paymentRequirements + Bazaar discovery
 * Paid   → handler result (scaffold / intent record)
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
  MC_TESTNET_ASA,
} from "./config.js";
import { verifyCredential } from "./verify.js";
import {
  buildMcTransferIntent,
  MC_NAME,
  MC_TESTNET_CAIP2,
  MC_UNIT,
} from "./mc.js";

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

const mcIntentExampleOutput = {
  ok: true,
  intent: "mc-transfer",
  networkMc: MC_TESTNET_CAIP2,
  mcAsaId: MC_TESTNET_ASA,
  mcUnitName: MC_UNIT,
  mcName: MC_NAME,
  to: "I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE",
  amount: 1,
  paymentAsset: "USDC",
  status: "intent_recorded",
  recordedAt: "2026-01-01T00:00:00.000Z",
};

/** Shared USDC accept block for all paid routes. */
function usdcAccept() {
  return {
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
  };
}

function merchantExtension() {
  return {
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
  };
}

const verifyBazaarExt = declareDiscoveryExtension({
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

const mcBazaarExt = declareDiscoveryExtension({
  bodyType: "json",
  input: {
    to: "I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE",
    amount: 1,
    from: "I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE",
    note: "pilot transfer",
  },
  inputSchema: {
    type: "object",
    properties: {
      to: {
        type: "string",
        description: "TestNet recipient address (must opt in to mC ASA)",
      },
      amount: {
        type: "integer",
        description: "Whole mC units (decimals=0)",
        minimum: 1,
      },
      from: { type: "string", description: "Optional sender address" },
      note: { type: "string", description: "Optional note (max 128 chars)" },
    },
    required: ["to", "amount"],
  },
  output: { example: mcIntentExampleOutput },
});

const paidRoutes = {
  "POST /v1/credential/verify": {
    accepts: [usdcAccept()],
    description:
      "metaCAMPUS agentic credential verification — pay USDC on Algorand, verify a credential hash",
    mimeType: "application/json",
    extensions: {
      ...verifyBazaarExt,
      ...merchantExtension(),
    },
  },
  "POST /v1/mc/transfer-intent": {
    accepts: [usdcAccept()],
    description:
      "metaCAMPUS mC transfer intent — pay USDC on Algorand MainNet; records a TestNet mC (ASA 773957514) transfer intent. Does not move mC on-chain.",
    mimeType: "application/json",
    extensions: {
      ...mcBazaarExt,
      ...merchantExtension(),
    },
  },
};

const app = express();

// Vercel / reverse proxies terminate TLS; needed so x402 resource.url is https://
app.set("trust proxy", 1);

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

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "metacampus-x402-verify",
    url: `${req.protocol}://${req.get("host")}`,
    network: networkCaip2,
    usdcAsa,
    price: priceDollarString(),
    priceAtomic: priceAtomicUnits(),
    payToConfigured: Boolean(payTo),
    ...(payTo ? { payTo } : {}),
    facilitator: facilitatorUrl,
    challengeTag,
    allowMockPayment,
    mc: {
      network: MC_TESTNET_CAIP2,
      asaId: MC_TESTNET_ASA,
      unit: MC_UNIT,
      name: MC_NAME,
      role: "transfer-intent-only",
      paymentAsset: "USDC",
    },
    poweredBy: "xAI",
  });
});

app.get("/", (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  res.json({
    name: "metaCAMPUS x402 Credential Verify",
    challenge: challengeTag,
    url: base,
    endpoints: {
      health: "GET /health",
      verify: "POST /v1/credential/verify (x402 paid, USDC)",
      mcTransferIntent:
        "POST /v1/mc/transfer-intent (x402 paid USDC; TestNet mC intent)",
    },
    mcAsaId: MC_TESTNET_ASA,
    docs: "https://github.com/metacampus-org/metacampus-x402-verify",
    facilitator: facilitatorUrl,
    poweredBy: "xAI",
    ...(payTo ? { payTo } : {}),
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

function handleMcIntent(
  req: express.Request,
  res: express.Response,
  paymentTxId?: string,
): void {
  const result = buildMcTransferIntent(req.body, {
    paymentTxId,
    paymentNetwork: networkCaip2,
    mcAsaId: MC_TESTNET_ASA,
  });

  if (!result.ok) {
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
  app.post("/v1/mc/transfer-intent", (req, res, next) => {
    const payment = req.header("X-PAYMENT") || req.header("PAYMENT-SIGNATURE");
    if (payment === "mock") {
      handleMcIntent(req, res, "mock-local-settle");
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

app.post("/v1/mc/transfer-intent", (req, res) => {
  handleMcIntent(req, res);
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
    console.log(`  mcAsa=${MC_TESTNET_ASA} (transfer-intent only)`);
    if (allowMockPayment) {
      console.log(`  ALLOW_MOCK_PAYMENT=true (X-PAYMENT: mock)`);
    }
  });
}
