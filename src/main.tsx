import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { wagmiConfig } from "./lib/appkit";
import { LanguageProvider } from "./lib/i18n";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <App />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#10162A",
                color: "#E7ECFF",
                border: "1px solid #1E2740",
                fontFamily: "Vazirmatn, sans-serif"
              }
            }}
          />
        </LanguageProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
