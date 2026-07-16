/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-pop-pink",
    "bg-pop-blue",
    "bg-pop-red",
    "bg-pop-violet",
    "bg-pop-magenta",
    "bg-pop-red",
    "bg-pop-orange",
    "text-pop-pink",
    "text-ink",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)"],
        holtwood: ["var(--font-holtwood"],
      },
      backgroundImage: {
        "purple-gradient":
          "linear-gradient(180deg, #9F42D1 0%, #C76CF8 50%, #B375D5 100%)",
        grad: `linear-gradient(
    146deg,
    #567dff 0%,
    #9f42d1 20%,
    #f04ab9 35%,
    #ff25c7 50%,
    #ff3c6d 75%,
    #ff856a 100%
  )`,
      },
      colors: {
        paper: "#ffffff",
        "paper-2": "#f5f5f7",
        "paper-3": "#e8e8ed",
        ink: "#1d1d1f",
        "ink-2": "#6e6e73",
        muted: "#86868b",
        "pop-blue": "#567dff",
        "pop-violet": "#9f42d1",
        "pop-pink": "#f04ab9",
        "pop-magenta": "#ff25c7",
        "pop-red": "#ff3c6d",
        "pop-orange": "#ff856a",
        accent: "#f04ab9",
      },
    },
  },
  plugins: [],
};
