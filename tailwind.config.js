import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: colors.neutral,
        coffee: { 50:'#f8f5f0', 100:'#eee5d9', 600:'#967451', 700:'#725538', 800:'#493729', 900:'#272a24' }
      },
      boxShadow: { soft:'0 3px 16px rgba(44, 39, 31, .025)' }
    }
  },
  plugins: []
}