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
          darkest: "#070B14",
          DEFAULT: "#0B1220",
          card: "#101B30",
          /* Panels/cards: lighter than page bg (#05070a) for clear separation */
          elevated: "#162544",
        },
        muted: {
          DEFAULT: "#9AA9BF",
          dim: "#64748B",
        },
        accent: {
          DEFAULT: "#E11D2E",
          hover: "#FB7185",
          glow: "rgba(225, 29, 46, 0.22)",
        },
        brand: {
          /* Used as a secondary highlight in a few UI spots */
          purple: "#2563EB",
        },
        success: {
          DEFAULT: "#16A34A",
          hover: "#22C55E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        roboto: ["var(--font-roboto)", "Roboto", "system-ui", "sans-serif"],
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
        "accent-sm": "0 0 24px rgba(225, 29, 46, 0.22)",
        "accent-md": "0 0 40px rgba(225, 29, 46, 0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
