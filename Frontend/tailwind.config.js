/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)', secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)', surface: 'rgb(var(--color-surface) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)', muted: 'rgb(var(--color-muted) / <alpha-value>)', danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      fontFamily: { display: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'], body: ['var(--font-inter)', 'system-ui', 'sans-serif'], mono: ['var(--font-jetbrains)', 'monospace'] },
      boxShadow: { card: 'var(--shadow-card)', 'card-md': 'var(--shadow-card-md)', 'card-lg': 'var(--shadow-card-lg)', brand: 'var(--shadow-card-md)' },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
      animation: { 'fade-in': 'fadeIn 0.4s ease-out', 'slide-up': 'slideUp 0.4s ease-out', 'slide-down': 'slideDown 0.3s ease-out', shimmer: 'shimmer 1.8s linear infinite', float: 'float 3s ease-in-out infinite' },
      keyframes: { fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } }, slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } }, slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } }, shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } }, float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } } },
    },
  },
  plugins: [],
};
