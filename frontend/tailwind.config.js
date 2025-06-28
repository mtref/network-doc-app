/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeInDown: {
          'from': { opacity: '0', transform: 'translateY(-20px) translateX(-50%)' },
          'to': { opacity: '1', transform: 'translateY(0) translateX(-50%)' },
        }
      },
      animation: {
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}