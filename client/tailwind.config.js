/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D71920',
          redHover: '#B8141A',
          redLight: '#FDF2F2',
          black: '#111111',
          dark: '#181818',
          cardDark: '#202020',
          gray: '#F5F5F5',
          border: '#E5E5E5',
          success: '#16803C',
          warning: '#D97706',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

