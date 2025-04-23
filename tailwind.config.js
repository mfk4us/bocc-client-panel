const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    screens: {
      xs: '700px',
      ...defaultTheme.screens,
    },
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#1e293b',
        muted: '#64748b',
        background: '#f8fafc',
        surface: '#ffffff',
        darkBg: '#0f172a',
        darkCard: '#1e293b',
        textLight: '#f1f5f9',
        textDark: '#0f172a'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // require('@tailwindcss/aspect-ratio'), // Commented out as not currently in use
  ],
}