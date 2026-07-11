import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export interface GeneratedWallet {
  address: `0x${string}`;
  privateKey: `0x${string}`;
}

/**
 * Generates N brand-new, real wallets (valid private key + derived address).
 *
 * We deliberately do NOT send tokens to literally random 20-byte addresses:
 * almost none of them have a known private key, so tokens sent there are
 * gone forever. Generating real keypairs first means every "random wallet"
 * is actually spendable — useful for testing distribution, airdrop
 * simulations, or seeding demo wallets — and the private keys are shown so
 * the user can save and reuse them.
 */
export function generateRandomWallets(count: number): GeneratedWallet[] {
  const wallets: GeneratedWallet[] = [];
  for (let i = 0; i < count; i++) {
    const pk = generatePrivateKey();
    const account = privateKeyToAccount(pk);
    wallets.push({ address: account.address, privateKey: pk });
  }
  return wallets;
}

export function walletsToCsv(wallets: GeneratedWallet[]): string {
  const rows = ["address,private_key", ...wallets.map((w) => `${w.address},${w.privateKey}`)];
  return rows.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
