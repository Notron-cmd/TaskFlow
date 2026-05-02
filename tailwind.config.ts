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
        // Theme color variables
        'theme-primary': 'var(--color-primary)',
        'theme-secondary': 'var(--color-secondary)',
        'theme-accent': 'var(--color-accent)',
        'theme-background': 'var(--color-background)',
        'theme-text': 'var(--color-text)',
        'theme-border': 'var(--color-border)',
        'theme-hover': 'var(--color-hover)',
        'theme-focus': 'var(--color-focus)',
      },
      backgroundColor: {
        'theme-base': 'rgb(var(--color-bg-base) / <alpha-value>)',
        'theme-card': 'rgb(var(--color-bg-card) / <alpha-value>)',
        'theme-elevated': 'rgb(var(--color-bg-elevated) / <alpha-value>)',
        'theme-primary': 'var(--color-primary)',
        'theme-secondary': 'var(--color-secondary)',
        'theme-background': 'var(--color-background)',
      },
      textColor: {
        'theme-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'theme-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'theme-text': 'var(--color-text)',
      },
      borderColor: {
        'theme-border': 'rgb(var(--color-border) / <alpha-value>)',
        'theme': 'var(--color-border)',
      },
    },
  },
  plugins: [],
};
export default config;
