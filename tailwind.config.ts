import type { Config } from "tailwindcss";

export default {
  content: [
    "./starter-app/apps/web/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./starter-app/packages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
