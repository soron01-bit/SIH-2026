/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#131b2e',
          925: '#0b101c',
          950: '#070b14',
        },
        meteor: {
          950: '#070b14',
          900: '#0c1220',
          850: '#11192c',
          800: '#162238',
          750: '#1e2d4a',
          700: '#25385c',
          600: '#344d7a',
          border: '#1b253b',
          'border-light': '#263554',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        cyclone: {
          cyan: '#0284c7',
          teal: '#0d9488',
          emerald: '#10b981',
          amber: '#f59e0b',
          orange: '#f97316',
          rose: '#f43f5e',
          magenta: '#c026d3',
          purple: '#7c3aed',
        },
        risk: {
          safe: '#10b981',
          watch: '#eab308',
          warning: '#f97316',
          danger: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
