// tailwind.config.ts
import { heroui } from "@heroui/theme";
import { customTheme } from "./config/theme";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",

  plugins: [
    heroui({
      addCommonColors: true,
      themes: customTheme.themes,
    }),
  ],
};

export default config;
