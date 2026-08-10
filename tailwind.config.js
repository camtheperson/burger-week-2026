/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'burger': {
          red: '#b3352c',
          'red-light': '#d1574c',
          mustard: '#e3a83c',
          'mustard-light': '#edc06a',
          brown: '#6b4423',
          'brown-light': '#8a5c34',
          green: '#4f8c3f',
          'green-light': '#71ad60',
        }
      }
    },
  },
  plugins: [],
}
