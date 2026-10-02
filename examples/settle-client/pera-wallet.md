# Pera / Lute browser settle (sketch)

`ClientAvmSigner` matches `@txnlab/use-wallet` (`address` + `signTransactions`). Keys never leave the wallet.

Full end-to-end: [GoPlausible client-web](https://github.com/GoPlausible/.github/tree/main/profile/algorand-x402-documentation/bazaar-global-hackathon-examples/client-web) · Guide: [Wallet as the signer](https://facilitator.goplausible.xyz/guide)

```tsx
import { useWallet } from "@txnlab/use-wallet-react";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactAvmScheme } from "@x402/avm";

// Vite entry (once):
// import { Buffer } from "buffer";
// if (!globalThis.Buffer) globalThis.Buffer = Buffer;

const MAINNET =
  "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";

const VERIFY_URL =
  "https://metacampus-x402-verify.vercel.app/v1/credential/verify";

export function useSettleVerify() {
  const { activeAddress, signTransactions } = useWallet();

  return async (hash: string) => {
    if (!activeAddress || !signTransactions) {
      throw new Error("Connect Pera (or Lute) first");
    }
    const client = new x402Client().register(
      MAINNET,
      new ExactAvmScheme({ address: activeAddress, signTransactions }),
    );
    const paidFetch = wrapFetchWithPayment(fetch, client);
    const res = await paidFetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  };
}
```

For the **first** MainNet settle without a Bazaar row, prefer the CLI in [`index.ts`](./index.ts) / [`README.md`](./README.md) Path A.
