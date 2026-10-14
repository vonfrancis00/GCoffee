import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: colors.neutral,
        coffee: { 50:'#fafafa', 100:'#f5f5f5', 600:'#525252', 700:'#404040', 800:'#171717', 900:'#000000' }
      },
      boxShadow: { soft:'0 8px 28px rgba(0, 0, 0, .07)' }
    }
  },
  plugins: []
}