/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        aqua: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#0ea5e9',
          600: '#0284c7',
          800: '#075985',
          900: '#0c4a6e',
          950: '#020d1a',
        },
        gold: {
          400: '#f6e05e',
          500: '#ecc94b',
          600: '#d69e2e',
        },
      },
    },
  },
  plugins: [],
};
