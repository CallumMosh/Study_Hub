/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0D0C",
        elevated: "#141716",
        line: "rgba(237,237,232,0.08)",
        ink: "#EDEDE8",
        muted: "#9CA39B",
        accent: "#CBA35C",
        accentDim: "#8A7238",
        good: "#7FA88A",
        bad: "#C4746A",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
