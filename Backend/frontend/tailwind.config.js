module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f8ff',
          100: '#e6eeff',
          200: '#cfe0ff',
          500: '#5b6bff'
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))'
      }
    }
  },
  plugins: []
}
