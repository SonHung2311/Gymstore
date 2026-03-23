import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Gym store notion-style color palette (da bò / warm brown)
        primary: {
          DEFAULT: "#8B4513",  // SaddleBrown — main brand color
          hover: "#7A3B10",
        },
        secondary: {
          DEFAULT: "#D2691E",  // Chocolate — accents
          hover: "#B85A18",
        },
        accent: "#CD853F",      // Peru — badges, tags
        light: "#DEB887",       // BurlyWood — borders, subtle backgrounds
        surface: "#FDF5E6",     // OldLace — page background
        dark: "#3D1C02",        // Very dark brown — body text
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
