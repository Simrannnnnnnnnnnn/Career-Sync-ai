import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        foreground: "var(--text-primary)",
        card: "var(--bg-card)",
        border: "var(--border)",
        accent: "var(--accent)",
        muted: "var(--text-muted)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Segoe UI", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;