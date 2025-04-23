/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' }
        },
        'blink-glow-animation': {
          '0%': {
            textShadow: '0 0 5px rgba(0, 255, 255, 0.5), 0 0 15px rgba(0, 255, 255, 0.5)'
          },
          '50%': {
            textShadow: '0 0 10px rgba(0, 0, 255, 0.5), 0 0 20px rgba(0, 0, 255, 0.5)'
          },
          '100%': {
            textShadow: '0 0 5px rgba(0, 255, 255, 0.5), 0 0 15px rgba(0, 255, 255, 0.5)'
          }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(20px)', opacity: '0' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        blink: 'blink 1.5s infinite',
        'blink-glow': 'blink-glow-animation 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-in-out',
        'slide-down': 'slideDown 0.5s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out'
      }
    }
  },
  plugins: []
}
