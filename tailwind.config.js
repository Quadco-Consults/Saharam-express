/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'saharam': {
          50: '#fdf7ed',
          100: '#f9ead6',
          200: '#f2d3ac',
          300: '#e9b577',
          400: '#de8f40',
          500: '#d4741e',
          600: '#c55d14',
          700: '#a54513',
          800: '#853717',
          900: '#6d2e16',
        },
      },
    },
  },
  plugins: [],
}