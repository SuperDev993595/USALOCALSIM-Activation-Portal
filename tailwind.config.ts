import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          darkest: "#05070a",
          DEFAULT: "#080c12",
          card: "#151f30",
          /* Panels/cards: lighter than page bg (#05070a) for clear separation */
          elevated: "#1e2d42",
        },
        muted: {
          DEFAULT: "#8e9fb1",
          dim: "#5c6b7a",
        },
        accent: {
          DEFAULT: "#00e6a8",
          hover: "#00ff9d",
          glow: "rgba(0, 230, 168, 0.22)",
        },
        brand: {
          purple: "#7b5dfb",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        /* Kept for utilities; body grid uses globals.css :root vars for visibility */
        "grid-tech":
          "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        "accent-sm": "0 0 24px rgba(0, 230, 168, 0.2)",
        "accent-md": "0 0 40px rgba(0, 255, 157, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
