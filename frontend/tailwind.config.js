/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
