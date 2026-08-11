import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        "paper-elevated": "var(--color-paper-elevated)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        accent: "var(--color-accent)",
        "accent-strong": "var(--color-accent-strong)",
        "accent-soft": "var(--color-accent-soft)",
        border: "var(--color-border)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        sans: "var(--font-body)",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [daisyui],
};
