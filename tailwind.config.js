/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: '#0a0e17',
        surface: '#111827',
        surface2: '#1a2235',
        border: '#1f2d45',
        accent: '#7c6af7',
        accent2: '#f97316',
        kotlin: '#7c52ff',
      }
    }
  },
  plugins: []
}
