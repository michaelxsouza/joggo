/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#101211',
        card: '#1A1D1B',
        surface: '#222623',
        'surface-2': '#2A2F2B',
        line: '#303630',
        lime: { DEFAULT: '#B0FF35', dim: '#9BE02E', ink: '#0E1209' },
        ink: { DEFAULT: '#F5F6F5', muted: '#A8B0AA', faint: '#7D857F' },
        danger: '#FF6B6B',
        warn: '#FFC857',
        info: '#6CC4FF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { xl: '14px', '2xl': '18px', '3xl': '24px' },
      boxShadow: { pop: '0 12px 40px -12px rgba(0,0,0,.65)' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(6px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
        heart: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.25)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'pop-in': 'pop-in .2s ease-out',
        'slide-up': 'slide-up .25s ease-out',
        heart: 'heart .3s ease-out',
      },
    },
  },
  plugins: [],
};
