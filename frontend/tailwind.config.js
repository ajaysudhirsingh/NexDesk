/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          light: '#3b82f6',  // blue-500
          dark: '#1e40af',   // blue-800
        },
        secondary: {
          DEFAULT: '#f59e42', // orange-400
          light: '#fbbf24',  // yellow-400
          dark: '#b45309',   // yellow-800
        },
        accent: {
          DEFAULT: '#10b981', // emerald-500
          light: '#6ee7b7',  // emerald-300
          dark: '#047857',   // emerald-800
        },
        background: {
          DEFAULT: '#f8fafc', // slate-50
          dark: '#1e293b',    // slate-800
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#334155',
        },
      },
    },
  },
  plugins: [],
};