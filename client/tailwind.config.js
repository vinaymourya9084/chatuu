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
        brand: {
          50: '#f0f4ff',
          100: '#dbe4fe',
          200: '#bfd1fe',
          300: '#93b4fd',
          400: '#608dfa',
          500: '#3b66f5',
          600: '#2547eb',
          700: '#1d35d8',
          800: '#1e2db0',
          900: '#1e2b8b',
          950: '#111855',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          sidebar: '#0b1120',
          hover: '#334155',
          border: '#334155'
        }
      },
      animation: {
        'bounce-subtle': 'bounce 1.5s infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
