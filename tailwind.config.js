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
        background: '#0A0A0A',
        card: '#141414',
        input: '#1C1C1C',
        primary: '#00E676',
        secondary: '#0F3D2E',
        text: '#F5F5F5',
        textSecondary: '#A1A1A1',
        border: '#2A2A2A',
        error: '#FF5C5C',
        success: '#22C55E',
        disabled: '#525252',
        transparent: 'transparent',
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
