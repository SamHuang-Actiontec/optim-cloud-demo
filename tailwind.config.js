/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noc: {
          bg:      'rgb(var(--noc-bg) / <alpha-value>)',
          surface: 'rgb(var(--noc-surface) / <alpha-value>)',
          raised:  'rgb(var(--noc-raised) / <alpha-value>)',
          border:  'rgb(var(--noc-border) / <alpha-value>)',
          fg:      'rgb(var(--noc-fg) / <alpha-value>)',
          label:   'rgb(var(--noc-label) / <alpha-value>)',
          muted:   'rgb(var(--noc-muted) / <alpha-value>)',
          accent:  'rgb(var(--noc-accent) / <alpha-value>)',
          warning: 'rgb(var(--noc-warning) / <alpha-value>)',
          danger:  'rgb(var(--noc-danger) / <alpha-value>)',
          info:    'rgb(var(--noc-info) / <alpha-value>)',
        },
      },
      fontFamily: {
        code: ['"Fira Code"', 'monospace'],
        sans: ['"Fira Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.7rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}
