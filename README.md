# B20 Deployer

A web app for launching and managing **B20 tokens** on [Base](https://base.org) — the native, protocol-level token standard that shipped with Base's Beryl upgrade (June 25, 2026). B20 tokens run as chain precompiles instead of deployed bytecode, while staying fully ERC-20 compatible with wallets, explorers, and exchanges.

With this site you can:

- Launch a new B20 Asset token (name, symbol, decimals, optional supply cap, optional initial mint) on **Base Mainnet** or **Base Sepolia (testnet)**
- Manage a token you've launched: mint, burn, transfer, batch-send, and pause/unpause
- Upload a token logo/metadata to IPFS
- Keep a local history of tokens you've deployed from this browser

> ⚠️ **Mainnet uses real funds.** Always test your flow on Base Sepolia first.

---

## Using the site

### 1. Connect your wallet

Click **Connect Wallet** in the header. Any wallet supported by [Reown AppKit](https://reown.com) (formerly WalletConnect) works — MetaMask, Coinbase Wallet, Rainbow, WalletConnect-compatible mobile wallets, etc.

### 2. Pick a network

Use the network picker to choose **Mainnet** or **Testnet (Base Sepolia)** before launching or managing a token. The app will prompt you to switch networks in your wallet if needed.

### 3. Launch a token

Fill in:

| Field | Notes |
|---|---|
| Name | 1–40 characters |
| Symbol | 2–11 letters/numbers |
| Decimals | 6–18 |
| Supply cap | Optional — leave "no cap" checked for an uncapped token |
| Initial mint | Optional — amount minted to your wallet immediately at creation |
| Logo | Optional — uploaded to IPFS via Pinata |

When you submit, your wallet will ask you to sign the launch transaction. On success, your wallet automatically becomes the token's admin and is granted every operational role (mint, burn, pause/unpause, metadata, operator) in that same transaction — no follow-up "grant myself permission" step is needed.

### 4. Manage a token

Open any token from your deploy history (bottom of the page) to bring up the management panel:

| Action | Mainnet | Testnet |
|---|---|---|
| Mint | ✅ | ✅ |
| Burn | ✅ | ✅ |
| Transfer | — | ✅ |
| Batch mint / batch transfer | — | ✅ |
| Pause / unpause | — | ✅ |

Transfer, batch operations, and pause are currently testnet-only in this build while they get more real-world mileage on mainnet. Mint and burn are available on both.

Only the token's admin/role-holder (normally the wallet that launched it) can mint, burn, or pause — the panel shows a warning if the connected wallet doesn't hold the relevant role.

### 5. Gas on mainnet

B20 tokens are precompiles with no on-chain bytecode. Some wallets under-estimate gas for calls to addresses like this, which can cause a mint/burn to fail with an "out of gas" error even though the transaction itself was valid. This app works around that by asking the RPC node for a real gas estimate and adding a safety buffer before every write — you shouldn't need to set gas manually, but if a transaction still fails with an out-of-gas error, try again (network conditions can occasionally still outpace the buffer).

---

## Robinhood Chain: token & NFT deployer

A separate page at `/robinhood` (a floating badge on the main site links to it) lets you deploy on [Robinhood Chain](https://robinhood.com/us/en/chain/) — Robinhood's own Arbitrum-Orbit L2, chain ID 4663 on mainnet / 46630 on testnet, gas paid in ETH. It's a fully isolated app: its own theme, its own wallet-network handling, its own local deploy history — nothing here touches the B20/Base flow above.

Unlike Base's B20 standard, Robinhood Chain has no native asset precompile, so there's no "activation registry" step — deploying a token or NFT here deploys a real, ordinary contract:

- **Token (ERC-20)** — name, symbol, decimals, optional supply cap, optional initial mint, owner-gated mint, holder-gated burn, pause/unpause, transferable ownership.
- **NFT collection (ERC-721)** — name, symbol, metadata URI (either a per-token folder like `ipfs://.../` or one shared metadata file for simple membership-style drops), optional max supply, optional mint price in ETH, owner airdrop minting, ERC-2981 royalties, pause/unpause, ETH withdrawal.

Visiting `/robinhood` with a wallet already connected will try to switch it onto Robinhood Chain automatically; if that's rejected or there's no wallet yet, the in-page network picker handles it the same way the main site's does.

### One-time factory deploy

Because these are real deployed contracts (not a precompile Base already provides), the app calls a small factory contract — `contracts/robinhood/RHFactory.sol` — that deploys a fresh `RHToken` or `RHNFT` and hands you full ownership in the same transaction. Deploy it once per network and set the address in `.env`:

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge script contracts/script/DeployRHFactory.s.sol:DeployRHFactory \
  --rpc-url https://rpc.mainnet.chain.robinhood.com \
  --chain-id 4663 --private-key $PRIVATE_KEY --broadcast \
  --verify --verifier blockscout --verifier-url https://robinhoodchain.blockscout.com/api/
```

Repeat against the testnet (`https://rpc.testnet.chain.robinhood.com`, chain ID `46630`) and put both addresses in `VITE_RH_FACTORY_ADDRESS_MAINNET` / `VITE_RH_FACTORY_ADDRESS_TESTNET`. Until those are set, the Robinhood page's deploy buttons will show a "factory address not configured" error — everything else on the page (browsing, wallet connect, network switch) still works.

> If you deploy this site to static hosting, make sure `/robinhood` falls back to `index.html` the same way the root route does (most SPA hosting presets already rewrite every unmatched path to `index.html` — double check yours does, since this page is a real navigation, not client-side routing).

> **Compiling in Remix and seeing `DeclarationError: Function "mcopy" not found`?** OpenZeppelin Contracts 5.1's `ERC721Enumerable`/`ERC721Pausable` (used by `RHNFT.sol`) rely on the `mcopy` opcode (EIP-5656), which only exists from the Cancun EVM upgrade onward. This error means Remix's compiler is targeting an EVM version older than Cancun — open the **Solidity Compiler** tab → **Advanced Configurations** → **EVM Version**, and set it to `cancun` (or `prague`, or `default` if your Remix build already defaults there). Robinhood Chain runs on Arbitrum's ArbOS 20+, which has included Cancun opcodes (including `mcopy`) since March 2024, so this is purely a local compiler setting — the chain itself supports it fine.

## Running it yourself

```bash
npm install
cp .env.example .env   # fill in the values below
npm run dev
```

### Environment variables (`.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_REOWN_PROJECT_ID` | Yes | Project ID from [dashboard.reown.com](https://dashboard.reown.com) — powers wallet connection |
| `VITE_LAUNCHER_ADDRESS_MAINNET` | Yes | Address of your deployed `B20Launcher.sol` on Base Mainnet |
| `VITE_LAUNCHER_ADDRESS_TESTNET` | Yes | Address of your deployed `B20Launcher.sol` on Base Sepolia |
| `VITE_BATCH_DISTRIBUTOR_ADDRESS_MAINNET` | Optional | Address of `B20BatchDistributor.sol` on mainnet (enables one-tx batch transfers) |
| `VITE_BATCH_DISTRIBUTOR_ADDRESS_TESTNET` | Optional | Same, on testnet |
| `VITE_PINATA_JWT` | For logo uploads | JWT from [app.pinata.cloud](https://app.pinata.cloud) with `pinFileToIPFS`/`pinJSONToIPFS` access |
| `VITE_PINATA_GATEWAY` | For logo uploads | Defaults to `https://gateway.pinata.cloud` |
| `VITE_CREATOR_TWITTER` / `VITE_CREATOR_GITHUB` | Optional | Links shown in the footer |

### Deploying the contracts

The two Solidity contracts live in `contracts/`:

- `B20Launcher.sol` — one-time deploy per network; its `launchToken(...)` function creates a new B20 Asset token and grants the caller every operational role atomically.
- `B20BatchDistributor.sol` — optional; enables one-transaction batch transfers (as opposed to batch minting, which needs no extra contract).

A Foundry deploy script is provided at `contracts/script/DeployLauncher.s.sol`. Note that standard Foundry cannot simulate calls to B20 precompile addresses locally (they hold no bytecode), so use `base-forge` (Base's Foundry build) rather than plain `forge` when working with these contracts.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

---

## Tech stack

React + TypeScript + Vite, Tailwind CSS, [wagmi](https://wagmi.sh)/[viem](https://viem.sh) for chain interaction, [Reown AppKit](https://reown.com) for wallet connection, and Pinata for IPFS metadata storage.

## License

See [LICENSE](./LICENSE).
