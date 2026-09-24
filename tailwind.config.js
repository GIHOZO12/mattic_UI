export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--background)",
        ink: "var(--text-primary)",
        muted: "var(--text-secondary)",
        lime: "var(--accent)",
        powder: "var(--powder-blue)",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};
