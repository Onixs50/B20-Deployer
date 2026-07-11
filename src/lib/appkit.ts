import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia } from "@reown/appkit/networks";
import { REOWN_PROJECT_ID } from "./config";

if (!REOWN_PROJECT_ID) {
  // eslint-disable-next-line no-console
  console.error(
    "VITE_REOWN_PROJECT_ID تنظیم نشده. یک پروژه در https://dashboard.reown.com بساز و Project ID رو در .env بذار."
  );
}

const projectId = REOWN_PROJECT_ID ?? "MISSING_PROJECT_ID";

// Only Base networks are registered with AppKit. Any wallet connecting from
// another chain gets prompted by AppKit's own switcher, and our own
// NetworkGate component blocks all contract calls until the active chain
// is one of these two.
export const networks = [base, baseSepolia];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
});

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [base, baseSepolia] as any,
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
