/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REOWN_PROJECT_ID: string;
  readonly VITE_LAUNCHER_ADDRESS_MAINNET: string;
  readonly VITE_LAUNCHER_ADDRESS_TESTNET: string;
  readonly VITE_PINATA_JWT: string;
  readonly VITE_PINATA_GATEWAY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    "appkit-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      balance?: "show" | "hide";
      size?: "md" | "sm";
    };
    "appkit-network-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
