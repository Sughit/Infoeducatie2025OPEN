/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        yellow: "#E9D758",
        green: "#297373",
        orange: "#FF8552",
        gray: "#E6E6E6",
      }
    },
  },
  plugins: [],
}