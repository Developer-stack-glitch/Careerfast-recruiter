/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', 'var(--font-geist)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        geist: ['"Geist"', 'var(--font-geist)', 'sans-serif'],
        heading: ['"Geist"', 'var(--font-heading)', 'sans-serif'],
        outfit: ['"Geist"', 'var(--font-geist)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

