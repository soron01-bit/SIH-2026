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
        meteor: {
          950: '#060911',
          900: '#0b1120',
          850: '#0f172a',
          800: '#162238',
          750: '#1c2b46',
          700: '#233555',
          600: '#334e7a',
          border: '#1f2f4a',
          'border-light': '#2d4368',
        },
        cyclone: {
          cyan: '#06b6d4',
          teal: '#14b8a6',
          emerald: '#10b981',
          amber: '#f59e0b',
          orange: '#f97316',
          rose: '#f43f5e',
          magenta: '#d946ef',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-ping': 'radarPing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        radarPing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.9' },
          '70%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
