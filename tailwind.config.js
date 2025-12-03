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
        'saharan': {
          50: '#faf9f6',
          100: '#f5f5dc',
          200: '#ede4c7',
          300: '#deb887',
          400: '#cd853f',
          500: '#8b4513',
          600: '#7a3f12',
          700: '#654321',
          800: '#52341a',
          900: '#3d2414',
        },
      },
    },
  },
  plugins: [],
}