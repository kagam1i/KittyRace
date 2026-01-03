/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Kawaii Forest palette
        bg: "#F7FFF4",
        surface: "#FFFFFF",
        text: "#1B2A2A",

        green: "#34D399", // primary
        pink: "#FF7AB6",  // accent
        beige: "#F6E6C9", // support
        brown: "#6B4E3D", // shadow / dirt hint

        border: "rgba(27, 42, 42, 0.14)",
      },
      fontFamily: {
        heading: ["Fredoka", "system-ui", "sans-serif"],
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem", // чуть милее стандартного
      },
      boxShadow: {
        soft: "0 10px 30px rgba(107, 78, 61, 0.12)",
      },
    },
  },
  plugins: [],
};
