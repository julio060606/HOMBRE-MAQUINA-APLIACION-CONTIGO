/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        forest: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#136F53', // Verde principal refinado: más fresco, luminoso y moderno
          800: '#0E543F',
          900: '#093A2C',
        },
        cyan: {
          500: '#0284C7',
          600: '#0369A1',
          700: '#075985',
        },
        warmbg: '#FDFBF7',
        surface: '#FFFFFF',
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'soft-md': '0 1px 3px 0 rgba(16, 24, 40, 0.1), 0 1px 2px -1px rgba(16, 24, 40, 0.1)',
        'soft-lg': '0 4px 6px -1px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.1)',
        'soft-xl': '0 10px 15px -3px rgba(16, 24, 40, 0.08), 0 4px 6px -4px rgba(16, 24, 40, 0.04)',
      },
    },
  },
  plugins: [],
}
