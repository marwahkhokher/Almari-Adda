/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1917",
        cream: "#faf7f2",
        sand: "#f0e9df",
        clay: "#b45309",
        rose: {
          DEFAULT: "#be6a5a",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(28, 25, 23, 0.18)",
      },
    },
  },
  plugins: [],
};


