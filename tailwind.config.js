/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Фон страницы 
        bg: "#F6F1E3",

        // Поверхности/панели 
        surface: "#FFF8EC",

        // Основной текст 
        text: "#2F3A2E",

        // Основной зелёный 
        green: "#6FAF4B",

        // Акцент 
        pink: "#D96B8A",

        // Вспомогательный тёплый беж 
        beige: "#E8D3A8",

        // Коричневый 
        brown: "#7A5A3A",

        // Бордер 
        border: "rgba(47, 58, 46, 0.16)",
      },

      fontFamily: {
        pixel: ["Pixelify Sans", "system-ui", "sans-serif"],
        sans: ["Pixelify Sans", "system-ui", "sans-serif"],
        heading: ["Pixelify Sans", "system-ui", "sans-serif"],
      },

      boxShadow: {
        // Мягкая тень в “земляном” стиле 
        soft: "0 12px 30px rgba(122, 90, 58, 0.14)",
      },
    },
  },
  plugins: [],
};
