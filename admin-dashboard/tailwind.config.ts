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
        background: "#000000",
        foreground: "#ffffff",
        card: {
          DEFAULT: "rgba(10, 10, 12, 0.85)",
          hover: "rgba(18, 18, 22, 0.95)",
        },
        border: "rgba(255, 255, 255, 0.1)",
        primary: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          foreground: "#ffffff",
          glow: "rgba(239, 68, 68, 0.35)",
        },
        secondary: {
          DEFAULT: "#27272a",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#b91c1c",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#a1a1aa",
          foreground: "#71717a",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Fira Code", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'neon-red': '0 0 25px rgba(239, 68, 68, 0.3)',
        'neon-white': '0 0 20px rgba(255, 255, 255, 0.15)',
        'neon-rose': '0 0 25px rgba(220, 38, 38, 0.35)',
      }
    },
  },
  plugins: [],
};
export default config;
