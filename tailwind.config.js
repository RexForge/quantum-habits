/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // THIS makes the dark mode work
  theme: {
    extend: {
      colors: {
        // These are the exact "Sectograph" Blue and "HabitKit" Green
        primary: "#3b82f6",
        success: "#10b981",
        background: {
          dark: "#0f172a",
          light: "#f8fafc"
        }
      }
    },
  },
  plugins: [],
}