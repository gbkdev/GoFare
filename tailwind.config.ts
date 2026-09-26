import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecbff",
          400: "#59adff",
          500: "#2f8bff",
          600: "#1a6df2",
          700: "#1557d1",
          800: "#1747a8",
          900: "#193f84",
          950: "#122752",
        },
        fare: {
          DEFAULT: "#12b76a",
          dark: "#087443",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(18, 39, 82, 0.08)",
        card: "0 4px 24px rgba(18, 39, 82, 0.06)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2f8bff 0%, #1a6df2 45%, #193f84 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
