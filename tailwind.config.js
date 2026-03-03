/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}" ,"./src/index.css"],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
      },
    },
  },
  plugins: [],
}

