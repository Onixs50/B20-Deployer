import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import RobinhoodApp from "./robinhood/RobinhoodApp";
import { wagmiConfig } from "./lib/appkit";
import { LanguageProvider } from "./lib/i18n";
import "./index.css";

const queryClient = new QueryClient();

// Plain path-based routing, on purpose — no router dependency, no client-side
// navigation between the two apps. /robinhood is its own isolated page tree;
// everything else renders the original B20 Forge app completely untouched.
const isRobinhoodRoute = window.location.pathname.replace(/\/+$/, "") === "/robinhood";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          {isRobinhoodRoute ? <RobinhoodApp /> : <App />}
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
