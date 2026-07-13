/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090F',
          900: '#0A0D16',
          850: '#0D1220',
          800: '#111729',
          700: '#182036',
          600: '#232D48',
        },
        accent: {
          DEFAULT: '#FF6B35',
          soft: '#FF8C5F',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          soft: '#5EEAD4',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(255,107,53,0.15)',
        panel: '0 8px 32px rgba(0,0,0,0.45)',
        card: '0 2px 12px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
