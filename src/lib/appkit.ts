import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia } from "@reown/appkit/networks";
import { REOWN_PROJECT_ID } from "./config";
import { robinhoodChain, robinhoodChainTestnet } from "./robinhoodChain";

if (!REOWN_PROJECT_ID) {
  // eslint-disable-next-line no-console
  console.error(
    "VITE_REOWN_PROJECT_ID تنظیم نشده. یک پروژه در https://dashboard.reown.com بساز و Project ID رو در .env بذار."
  );
}

const projectId = REOWN_PROJECT_ID ?? "MISSING_PROJECT_ID";

// Base networks power the main B20 Forge flow; Robinhood Chain networks power
// the separate /robinhood page. Registering all four here just lets the
// wallet know about them — each page's own NetworkGate/guard still enforces
// which chains it actually accepts, so this list growing never changes what
// the Base flow can do.
export const networks = [base, baseSepolia, robinhoodChain, robinhoodChainTestnet] as any;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
});

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [base, baseSepolia, robinhoodChain, robinhoodChainTestnet] as any,
  defaultNetwork: base,
  projectId,
  metadata: {
    name: "B20 Forge",
    description: "بساز، مهر بزن، دیپلوی کن — لانچر توکن B20 روی شبکه Base",
    url: typeof window !== "undefined" ? window.location.origin : "https://b20forge.app",
    icons: ["/icon.svg"]
  },
  features: {
    analytics: false,
    email: false,
    socials: false
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#0052FF",
    "--w3m-border-radius-master": "10px"
  }
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
