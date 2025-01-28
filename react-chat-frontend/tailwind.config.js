/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Add dark mode variant
  theme: {
    extend: {
      colors: {
        // Custom color extensions
        primary: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
        },
        secondary: {
          DEFAULT: "#6366F1",
          dark: "#4F46E5",
        },
      },
    },
  },
  plugins: [],
};
