import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        card: "var(--card)",
        ink: "var(--ink)",
        mist: "var(--muted)",
        caption: "var(--caption)",
        gold: "var(--gold)",
        glow: "var(--glow)",
      },
      borderRadius: {
        btn: "var(--r-btn)",
        input: "var(--r-input)",
        card: "var(--r-card)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        hard: "var(--shadow-hard)",
        "glow-hero": "var(--glow-hero)",
        glass: "var(--shadow-glass)",
      },
      backdropBlur: {
        glass: "24px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
        swash: ["var(--font-swash)", "cursive"],
      },
      maxWidth: {
        wide: "1160px",
        narrow: "560px",
      },
    },
  },
  plugins: [],
};

export default config;
