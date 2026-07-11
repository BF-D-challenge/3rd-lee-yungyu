import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        card: "var(--card)",
        ink: "var(--ink)",
        mist: "var(--muted)",
        caption: "var(--caption)",
        primary: "var(--primary)",
        gold: "var(--gold)",
        glow: "var(--glow)",
        deco: "var(--deco-glow)",
        "deco-soft": "var(--deco-glow-soft)",
        rose: "var(--rose)",
        good: "var(--good)",
        "axis-source": "var(--axis-source)",
        "axis-payer": "var(--axis-payer)",
        "axis-moment": "var(--axis-moment)",
        "axis-twist": "var(--axis-twist)",
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
        "glow-deco": "var(--glow-deco-hero)",
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
