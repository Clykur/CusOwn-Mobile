/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFFFFF',
          light: '#F5F5F5',
          dark: '#171717',
          premium: '#FFFFFF',
          obsidian: '#000000',
        },
        secondary: {
          DEFAULT: '#000000',
          light: '#737373',
          dark: '#000000',
        },
        accent: {
          gold: '#000000',
          goldLight: '#A3A3A3',
          goldDark: '#000000',
          premium: '#000000',
        },
        luxury: {
          black: '#000000',
          charcoal: '#171717',
          gold: '#000000',
          silver: '#737373',
          emerald: '#000000',
        },
        textLight: '#737373',
        textDark: '#000000',
      },
      borderRadius: {
        premium: '20px',
        luxury: '28px',
      },
      spacing: {
        luxury: '24px',
        premium: '32px',
      },
    },
  },
  plugins: [],
};
