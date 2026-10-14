/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vturb: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#ea384c',
          700: '#d82a3e',
          800: '#991b1b',
        },
        instagram: {
          pink: '#E1306C',
          purple: '#C13584',
          orange: '#F56040',
        },
        youtube: '#FF0000',
        tiktok: '#00F2FE',
      }
    },
  },
  plugins: [],
}
