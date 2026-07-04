import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#070712",
        violetGlow: "#8b5cf6",
        mon: "#b6ff5c"
      },
      boxShadow: {
        glow: "0 0 40px rgba(139, 92, 246, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
