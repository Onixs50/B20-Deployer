# B20 Forge

**B20 Forge** is a web app for launching your own token on **Base** using the
new **B20 token standard** — no Solidity writing, no manual contract
deployment. Fill in a name, symbol, and supply, connect your wallet, and the
site creates the token for you in one transaction.

🇮🇷 فارسی می‌خونی؟ نسخهٔ فارسی این فایل: **[README.fa.md](./README.fa.md)**

---

## What is B20?

B20 is Base's native token standard: instead of deploying your own ERC-20
contract, a token is created through a built-in factory on the chain itself.
That makes it cheaper to launch and gives every token a consistent, built-in
set of features — mint, burn, pause, role-based permissions — without anyone
having to write or audit that logic themselves.

## What this site does

- **Launch a token** — enter a name, symbol, decimals, and (optionally) an
  initial supply cap and first mint, connect your wallet, and deploy. The
  site handles all the on-chain encoding for you.
- **Manage a token after launch** — every token you deploy comes with a
  management dashboard where you (the token's admin) can:
  - **Mint** new tokens to any address
  - **Burn** tokens from your balance
  - **Transfer** tokens to a single address
  - **Batch send** — mint or transfer to many addresses at once, in a single
    transaction (not one signature per recipient)
  - **Pause / unpause** all transfers
  - **Grant roles** (mint / burn / pause) to other addresses
- **Works on Base Mainnet and Base Sepolia (testnet)** — the site checks
  that your wallet is on one of these two networks before letting you sign
  anything.
- **Bilingual, RTL-aware interface** — switch between Persian and English;
  layout direction adjusts automatically.
- **Local token history** — a running list of tokens you've deployed from
  this browser, each one click away from its management dashboard.

## What this site is *not*

- It doesn't hold your funds or private keys. Every action is a normal
  wallet transaction that you review and sign yourself (MetaMask, Coinbase
  Wallet, etc., via [Reown AppKit](https://reown.com)).
- It's not an official Base product — it's an independent tool built on top
  of Base's public B20 standard and smart contracts.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Wallet / chain | wagmi, viem, Reown AppKit |
| Animation | Framer Motion |
| Contracts | Solidity, deployed on Base (see [`/contracts`](./contracts)) |
| Image hosting | IPFS via Pinata (for token logos) |

## Running it yourself

```bash
npm install
cp .env.example .env
npm run dev
```


## License

MIT — see [LICENSE](./LICENSE).
