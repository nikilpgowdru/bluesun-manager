/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        brand: ['Syne', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        obsidian: {
          950: '#050505',
          900: '#0a0a0c',
          850: '#111115',
          800: '#18181c',
          700: '#26262e',
        },
        gold: {
          50: '#fffbe6',
          100: '#fff3b3',
          200: '#ffe780',
          300: '#ffd74d',
          400: '#ffc41a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#78350f',
          900: '#451a03',
        },
        champagne: {
          100: '#fef7e0',
          200: '#fdeab8',
          300: '#fbd88b',
          400: '#f8c25b',
          500: '#f5a623',
        }
      },
      backgroundImage: {
        'gold-metallic': 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 50%, #b45309 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #f59e0b 0%, #fef3c7 50%, #f59e0b 100%)',
        'dark-obsidian': 'linear-gradient(145deg, #0a0a0c 0%, #121215 100%)',
        'gold-glass': 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
      }
    },
  },
  plugins: [],
}
