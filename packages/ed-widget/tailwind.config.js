/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './public/**/*.html', './index.html'],
  theme: {
    extend: {
      colors: {
        ed: {
          primary: '#2dd4bf',
          background: '#0f172a',
          surface: 'rgba(15, 23, 42, 0.9)',
          text: '#ffffff',
          muted: '#94a3b8',
          success: '#22c55e',
          error: '#ef4444',
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'morph': 'morph 300ms ease-out',
        'slide-up': 'slide-up 400ms ease-out',
        'pop-in': 'pop-in 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'morph': {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

