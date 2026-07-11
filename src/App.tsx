import { useRef, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LaunchForm } from "./components/LaunchForm";
import { TokenHistory } from "./components/TokenHistory";
import { Footer } from "./components/Footer";
import "./lib/appkit"; // side-effect: initializes Reown AppKit once

export default function App() {
  const formRef = useRef<HTMLDivElement>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  return (
    <div className="min-h-screen">
      <Header />
      <Hero onStart={() => formRef.current?.scrollIntoView({ behavior: "smooth" })} />
      <HowItWorks />
      <div ref={formRef} className="px-5 pb-24 pt-10">
        <LaunchForm onDeployed={() => setHistoryVersion((v) => v + 1)} />
      </div>
      <Footer />
      <TokenHistory refreshKey={historyVersion} />
    </div>
  );
}
