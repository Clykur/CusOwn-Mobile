/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F172A', // Slate 900
          light: '#334155',   // Slate 700
          dark: '#020617',    // Slate 950
        },
        secondary: {
          DEFAULT: '#3B82F6', // Blue 500
          light: '#60A5FA',   // Blue 400
          dark: '#2563EB',    // Blue 600
        },
        background: '#F8FAFC', // Slate 50
        card: '#FFFFFF',
        text: '#0F172A',
        textLight: '#64748B', // Slate 500
        error: '#EF4444',     // Red 500
        success: '#22C55E',   // Green 500
      },
    },
  },
  plugins: [],
}
