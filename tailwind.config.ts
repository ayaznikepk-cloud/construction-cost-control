import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#101a2e",
        navyLight: "#16233d",
        border: "#e2e5ea",
        positive: "#1a8f5a",
        warning: "#c98a12",
        danger: "#c73030",
        active: "#2563eb",
      },
    },
  },
  plugins: [],
};
export default config;
