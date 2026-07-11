import { useRef } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { LaunchForm } from "./components/LaunchForm";
import { Footer } from "./components/Footer";
import "./lib/appkit"; // side-effect: initializes Reown AppKit once

export default function App() {
  const formRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen">
      <Header />
      <Hero onStart={() => formRef.current?.scrollIntoView({ behavior: "smooth" })} />
      <div ref={formRef} className="px-5 pb-24">
        <LaunchForm />
      </div>
      <Footer />
    </div>
  );
}
