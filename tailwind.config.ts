import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: {
          base:     'rgb(var(--color-surface-base) / <alpha-value>)',
          card:     'rgb(var(--color-surface-card) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        },
      },
      backgroundColor: {
        'theme-base': 'rgb(var(--color-bg-base) / <alpha-value>)',
        'theme-card': 'rgb(var(--color-bg-card) / <alpha-value>)',
        'theme-elevated': 'rgb(var(--color-bg-elevated) / <alpha-value>)',
      },
      textColor: {
        'theme-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'theme-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
      },
      borderColor: {
        'theme-border': 'rgb(var(--color-border) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
export default config;
