/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tejas Design System — Dark + Gold Premium
        tejas: {
          bg: '#0f1117',
          sidebar: '#0a0d14',
          card: '#1a1d27',
          border: '#2a2d37',
          gold: '#d4a843',
          'gold-dark': '#b8922e',
          amber: '#f5a623',
          text: '#f0f0f0',
          muted: '#8b8fa3',
          'muted-dark': '#5a5d6a',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
          tier1: '#22c55e',
          tier2: '#f5a623',
          tier3: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #d4a843 0%, #b8922e 100%)',
        'amber-gradient': 'linear-gradient(135deg, #f5a623 0%, #d4880a 100%)',
      },
    },
  },
  plugins: [],
}
