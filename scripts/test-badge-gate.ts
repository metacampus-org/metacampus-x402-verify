/**
 * Local checks for the metaBADGE gate and the unpaid/paid HTTP paths.
 * Run: ALLOW_MOCK_PAYMENT=true npx tsx scripts/test-badge-gate.ts
 */
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { checkMetaBadge, listMockBadges } from "../src/badge-gate.js";

const VALID = {
  hash: "a1b2c3d4e5f6789012345678abcdef01",
  credentialId: "cred_example",
  issuerId: "issuer_example",
  agentId: "agent_example",
  attestation: "skill-verified",
};

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    throw new Error(msg);
  }
}

function unit(): void {
  const missing = checkMetaBadge({ hash: "deadbeefdeadbeefdeadbeefdeadbeef" });
  assert(missing.status === "unverified" && missing.exists === false, "missing badge should be unverified");

  const badIssuer = checkMetaBadge({ ...VALID, issuerId: "nope" });
  assert(badIssuer.status === "unverified" && badIssuer.exists && !badIssuer.issuerOk, "bad issuer");

  const badAgent = checkMetaBadge({ ...VALID, agentId: "nope" });
  assert(badAgent.status === "unverified" && !badAgent.agentOk, "bad agent");

  const badAtt = checkMetaBadge({ ...VALID, attestation: "nope" });
  assert(badAtt.status === "unverified" && !badAtt.attestationOk, "bad attestation");

  const ok = checkMetaBadge(VALID);
  assert(ok.status === "verified" && ok.issuerOk && ok.attestationOk && ok.agentOk, "full pass");

  console.log(`unit: ok (${listMockBadges().length} fixtures)`);
}

async function http(): Promise<void> {
  const port = 4029;
  const env = {
    ...process.env,
    PORT: String(port),
    ALLOW_MOCK_PAYMENT: "true",
    X402_PAY_TO: "I4ZBH6RZRTFQN6DSTYJESIGK4VPSMDTXSXJEYEVBADVDQFSOQR4OV55BVE",
    ALGORAND_NETWORK: "mainnet",
  };
  const child: ChildProcess = spawn("npx", ["tsx", "src/index.ts"], {
    cwd: new URL("..", import.meta.url).pathname,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout?.on("data", (d) => { logs += d.toString(); });
  child.stderr?.on("data", (d) => { logs += d.toString(); });

  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        const r = await fetch(`${base}/health`);
        if (r.ok) { ready = true; break; }
      } catch { /* retry */ }
      await delay(250);
    }
    assert(ready, "server did not become ready\n" + logs);

    // 1. Missing badge → unverified, no 402
    const missing = await fetch(`${base}/v1/credential/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash: "deadbeefdeadbeefdeadbeefdeadbeef", issuerId: "x", agentId: "y", attestation: "z" }),
    });
    const missingBody = await missing.json();
    assert(missing.status === 200, `missing expected 200, got ${missing.status}`);
    assert(missingBody.status === "unverified" && missingBody.payment === "rejected", "missing should reject payment");

    // 2. Exists but wrong agent → unverified
    const wrong = await fetch(`${base}/v1/credential/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...VALID, agentId: "not-the-agent" }),
    });
    const wrongBody = await wrong.json();
    assert(wrong.status === 200 && wrongBody.status === "unverified" && wrongBody.exists === true, "wrong agent should be unverified");

    // 3. Full pass, unpaid → 402 (unpaid, result not released)
    const unpaid = await fetch(`${base}/v1/credential/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID),
    });
    assert(unpaid.status === 402, `unpaid expected 402, got ${unpaid.status}`);

    // 4. Full pass + mock payment → verified
    const paid = await fetch(`${base}/v1/credential/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-PAYMENT": "mock" },
      body: JSON.stringify(VALID),
    });
    const paidBody = await paid.json();
    assert(paid.status === 200, `paid expected 200, got ${paid.status} ${JSON.stringify(paidBody)}`);
    assert(paidBody.status === "verified" && paidBody.valid === true && paidBody.payment === "paid", "paid should be verified");
    assert(paidBody.agentId === "agent_example" && paidBody.issuerId === "issuer_example", "paid echoes assignment");

    console.log("http: ok (unverified reject, unpaid 402, paid verified)");
  } finally {
    child.kill("SIGTERM");
    await delay(200);
  }
}

unit();
await http();
console.log("all checks passed");
