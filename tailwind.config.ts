import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050a10",
        foreground: "#f1f5f9",
        champagne: {
          300: "#f3e8d2",
          400: "#e8d5b5",
          500: "#d4b483",
        },
        cyanLuxe: "#38bdf8",
      },
      fontFamily: {
        editorial: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config

