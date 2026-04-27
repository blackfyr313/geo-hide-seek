/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#080d1a",
        panel:   "#0e1625",
        border:  "#1a2540",
        teal:    { DEFAULT: "#00d4aa", dark: "#00a688" },
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
        body:    ["'DM Sans'", "sans-serif"],
      }
    }
  },
  plugins: []
}
