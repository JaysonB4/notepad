import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // Dark mode is toggled by a "dark" class on <html> (see ThemeToggle).
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Warm blacks for the toolbar and sidebar in dark mode.
        warmblack: {
          DEFAULT: "#1a1612",
          deep: "#120f0c",
          line: "#2b241e",
          hover: "#2f2821",
          edge: "#40372d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
