module.exports = {
  purge: [],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Changed from false to 'class' for explicit control
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
