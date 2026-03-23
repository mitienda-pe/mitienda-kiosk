export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#f9f506',
        'primary-dark': '#e6e205',
        'background-light': '#f8f8f5',
        'background-dark': '#23220f',
        'surface-light': '#ffffff',
        'surface-dark': '#2c2b18',
        'text-main': '#181811',
        'subtle-dark': '#8c8b5f',
      },
      fontFamily: {
        display: ['Spline Sans', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      borderRadius: {
        DEFAULT: '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
      },
      animation: {
        'breath': 'breath 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
      },
      keyframes: {
        breath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(249, 245, 6, 0.7)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 20px rgba(249, 245, 6, 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(249, 245, 6, 0)' },
        },
      },
    },
  },
  plugins: [],
}
