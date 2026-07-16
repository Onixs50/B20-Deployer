/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: "#0A0E1A",
          panel: "#10162A",
          line: "#1E2740",
          blue: "#0052FF",
          bluebright: "#3D7CFF",
          mint: "#00E6A0",
          amber: "#FFB020",
          crimson: "#FF4D6D",
          ink: "#E7ECFF",
          faint: "#7C88B8"
        },
        rh: {
          bg: "#0F0F0A",
          panel: "#1A1A12",
          line: "#33331F",
          yellow: "#FFDE59",
          yellowbright: "#FFEA8A",
          deep: "#B8860B",
          ink: "#FFFCF0",
          faint: "#B8B49A",
          black: "#0A0A08"
        }
      },
      fontFamily: {
        display: ["'Vazirmatn'", "'Space Grotesk'", "sans-serif"],
        body: ["'Vazirmatn'", "'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"]
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(10,14,26,0) 0%, #0A0E1A 90%), radial-gradient(ellipse at top, rgba(0,82,255,0.25), transparent 60%)"
      },
      keyframes: {
        stampin: {
          "0%": { transform: "scale(2.2) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(0.96) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" }
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        spinslow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        wobble: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(-10deg)" },
          "30%": { transform: "rotate(8deg)" },
          "45%": { transform: "rotate(-6deg)" },
          "60%": { transform: "rotate(4deg)" },
          "75%": { transform: "rotate(-2deg)" }
        },
        pulseglow: {
          "0%,100%": { boxShadow: "0 0 0px 0px rgba(255,222,89,0.55)" },
          "50%": { boxShadow: "0 0 22px 6px rgba(255,222,89,0.55)" }
        }
      },
      animation: {
        stampin: "stampin 0.6s cubic-bezier(.2,1,.3,1) forwards",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        spinslow: "spinslow 6s linear infinite",
        wobble: "wobble 2.6s ease-in-out infinite",
        pulseglow: "pulseglow 2.6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
