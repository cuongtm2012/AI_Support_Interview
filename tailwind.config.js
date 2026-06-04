/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        mono: ["ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          base: "#070b10",
          elevated: "#0f1419",
          card: "#131a22",
        },
        accent: {
          DEFAULT: "#2dd4bf",
          hover: "#14b8a6",
          muted: "rgba(45, 212, 191, 0.15)",
        },
        live: {
          DEFAULT: "#f59e0b",
          muted: "rgba(245, 158, 11, 0.15)",
        },
      },
      boxShadow: {
        panel: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(148, 163, 184, 0.08)",
        glow: "0 0 20px rgba(45, 212, 191, 0.15)",
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};
