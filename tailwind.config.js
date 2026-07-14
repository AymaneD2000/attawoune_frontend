/** @type {import('tailwindcss').Config} */

const brandBlue = {
  50: '#f1f6fc',
  100: '#ddeaf8',
  200: '#bdd6f0',
  300: '#8db8e4',
  400: '#5794d3',
  500: '#2f72b8',
  600: '#1a4c91',
  700: '#163f78',
  800: '#153664',
  900: '#142e54',
  950: '#0b1b33',
};

const brandGreen = {
  50: '#effbf4',
  100: '#d8f5e3',
  200: '#b4ebcb',
  300: '#82dca8',
  400: '#4ac978',
  500: '#1bab53',
  600: '#148b43',
  700: '#126f38',
  800: '#125930',
  900: '#104a29',
  950: '#072918',
};

const brandOrange = {
  50: '#fff8ec',
  100: '#fcebd0',
  200: '#f8d493',
  300: '#f2b95e',
  400: '#efa54a',
  500: '#e59741',
  600: '#c87325',
  700: '#a65320',
  800: '#87421f',
  900: '#71381d',
  950: '#3e1b0c',
};

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: brandBlue,
        blue: brandBlue,
        indigo: brandBlue,
        green: brandGreen,
        emerald: brandGreen,
        teal: brandGreen,
        purple: brandGreen,
        amber: brandOrange,
        orange: brandOrange,
        pink: brandOrange,
        brand: {
          blue: '#1a4c91',
          green: '#1bab53',
          orange: '#e59741',
          earth: '#6a310d',
          ink: '#101820',
          canvas: '#f6f8f6',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans Arabic',
          'Segoe UI',
          'Tahoma',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 12px 36px rgba(20, 46, 84, 0.08)',
        panel: '0 8px 24px rgba(20, 46, 84, 0.07)',
        floating: '0 20px 55px rgba(11, 27, 51, 0.18)',
      },
      backgroundImage: {
        'brand-radial':
          'radial-gradient(circle at top right, rgba(27,171,83,.13), transparent 34%), radial-gradient(circle at bottom left, rgba(229,151,65,.11), transparent 30%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .35s ease-out both',
      },
    },
  },
  plugins: [],
};
