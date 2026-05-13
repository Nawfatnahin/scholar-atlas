/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F2EFE6",
        "bg-warm": "#fdf8f0",
        "bg-sidebar": "#fffdf8",
        ink: "#0D0D0D",
        "ink-2": "#3D3D3D",
        "ink-3": "#7A7A7A",
        "ink-4": "#B0B0B0",
        accent: "#92400e",
        "accent-orange": "#f97316",
        "accent-amber": "#f59e0b",
        "accent-light": "#F5EFEB",
        "border-strong": "rgba(0, 0, 0, 0.08)",
      },
      fontFamily: {
        display: ["var(--font-lora)", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "serif"],
      },
      animation: {
        float: "floatY 4s ease-in-out infinite",
        "shimmer": "shimmer 2.5s infinite linear",
      },
      keyframes: {
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
