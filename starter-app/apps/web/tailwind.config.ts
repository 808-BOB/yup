import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary) / <alpha-value>)",
      },
    },
  },
  plugins: [],
}

export default config 