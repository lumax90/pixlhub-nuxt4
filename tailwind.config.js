/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pixl: {
          blue: '#2563EB',
          slate: '#1E293B',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'h1': ['28px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['13px', { lineHeight: '1.4', fontWeight: '400' }]
      },
      spacing: {
        '0': '0',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '7': '56px',
        '8': '64px'
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px'
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.1)'
      }
    }
  },
  plugins: []
}

