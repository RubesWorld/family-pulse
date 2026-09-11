import type { Config } from "tailwindcss";

/**
 * Warm Scrapbook.
 *
 * Every colour resolves through a CSS variable defined in globals.css,
 * so switching `data-theme` on <html> re-themes the whole app without
 * any component knowing which theme it is in.
 *
 * Accents accept Tailwind alpha modifiers (bg-coral/20). Surfaces bake
 * in their own alpha token instead, because night uses translucent
 * frosted cards while day uses solid ones.
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
        // --- surfaces (alpha baked in per theme) ---
        paper: "hsl(var(--paper))",
        "paper-2": "hsl(var(--paper-2))",
        card: "hsl(var(--card) / var(--card-alpha))",
        edge: "hsl(var(--edge) / var(--edge-alpha))",
        field: "hsl(var(--field) / var(--field-alpha))",
        nav: "hsl(var(--nav-bg) / var(--nav-bg-alpha))",

        // --- ink ---
        ink: "hsl(var(--ink))",
        "ink-soft": "hsl(var(--ink-soft) / var(--ink-soft-alpha))",
        "ink-faint": "hsl(var(--ink-faint) / var(--ink-faint-alpha))",

        // --- person accents (alpha-modifier friendly) ---
        coral: "hsl(var(--coral) / <alpha-value>)",
        denim: "hsl(var(--denim) / <alpha-value>)",
        plum: "hsl(var(--plum) / <alpha-value>)",
        marigold: "hsl(var(--marigold) / <alpha-value>)",
        sage: "hsl(var(--sage) / <alpha-value>)",

        "on-accent": "hsl(var(--on-accent))",
        "on-ink": "hsl(var(--on-ink))",

        // --- shadcn compatibility ---
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground) / var(--ink-soft-alpha))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
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
        border: "hsl(var(--border) / var(--edge-alpha))",
        input: "hsl(var(--input) / var(--edge-alpha))",
        ring: "hsl(var(--ring) / <alpha-value>)",
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
        press: "0 3px 0 hsl(var(--edge) / 0.5)",
      },

      backdropBlur: {
        card: "24px",
      },

      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-18px,0) scale(1.06)" },
        },
      },

      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        drift: "drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
