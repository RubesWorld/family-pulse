import type { Config } from "tailwindcss";

/**
 * Warm Scrapbook.
 *
 * Every colour resolves through a CSS variable defined in globals.css,
 * so switching `data-theme` on <html> re-themes the whole app without
 * any component knowing which theme it is in.
 *
 * Accents are space-separated RGB triples and accept Tailwind alpha
 * modifiers (bg-coral/20). Surfaces are finished colours with their
 * alpha already applied, because night uses translucent frosted cards
 * while day uses solid ones and nothing ever varies that alpha on its
 * own.
 */
const config: Config = {
  // Themes are driven entirely by tokens, so `dark:` is rarely needed —
  // it is wired to the night attribute for the odd one-off.
  darkMode: ["class", '[data-theme="night"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- surfaces (finished colours, alpha already applied) ---
        paper: "hsl(var(--paper))",
        "paper-2": "hsl(var(--paper-2))",
        card: "var(--card)",
        edge: "var(--edge)",
        field: "var(--field)",
        nav: "var(--nav-bg)",

        // --- ink ---
        ink: "hsl(var(--ink))",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",

        // --- person accents (alpha-modifier friendly) ---
        coral: "rgb(var(--coral) / <alpha-value>)",
        denim: "rgb(var(--denim) / <alpha-value>)",
        plum: "rgb(var(--plum) / <alpha-value>)",
        marigold: "rgb(var(--marigold) / <alpha-value>)",
        sage: "rgb(var(--sage) / <alpha-value>)",

        "on-accent": "hsl(var(--on-accent))",
        "on-ink": "hsl(var(--on-ink))",

        // --- shadcn compatibility ---
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // --primary, --accent and --ring alias accent tokens, so they
        // carry the accents' RGB-triple shape rather than HSL.
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },

      fontFamily: {
        // Fraunces — for words a person actually wrote
        display: ["var(--font-display)", "Iowan Old Style", "Georgia", "serif"],
        // Nunito — chrome, meta and controls
        body: ["var(--font-body)", "Avenir Next", "system-ui", "sans-serif"],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 0.5rem)",
        sm: "calc(var(--radius) - 0.75rem)",
        card: "1.625rem",
        panel: "1.375rem",
        field: "1rem",
      },

      borderWidth: {
        card: "var(--card-bw)",
      },

      boxShadow: {
        card: "var(--card-shadow)",
        nav: "0 16px 40px -14px rgb(0 0 0 / 0.7), inset 0 1px 0 rgb(255 235 210 / 0.14)",
      },

      backdropBlur: {
        card: "24px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
