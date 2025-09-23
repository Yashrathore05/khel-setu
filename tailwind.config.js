/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          md: '1.5rem',
          lg: '2rem',
        },
        screens: {
          '2xl': '1200px',
        },
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec4ff',
          400: '#5aa4ff',
          500: '#2b82ff',
          600: '#1766db',
          700: '#1450ad',
          800: '#163f85',
          900: '#16366b',
          950: '#0f2242',
        },
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 2px 6px -1px rgb(0 0 0 / 0.06)',
        'elevated': '0 10px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.12)'
      },
      borderRadius: {
        xl: '0.9rem',
      }
    }
  }
};
