/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#fcfcfb',
        'surface-dark': '#1a1a19',
        plane: '#f9f9f7',
        'plane-dark': '#0d0d0d',
        ink: {
          primary: '#0b0b0b',
          'primary-dark': '#ffffff',
          secondary: '#52514e',
          'secondary-dark': '#c3c2b7',
          muted: '#898781',
        },
        hairline: '#e1e0d9',
        'hairline-dark': '#2c2c2a',
        status: {
          good: '#0ca30c',
          warning: '#fab219',
          serious: '#ec835a',
          critical: '#d03b3b',
        },
        series: {
          blue: '#2a78d6',
          'blue-dark': '#3987e5',
          orange: '#eb6834',
          'orange-dark': '#d95926',
          aqua: '#1baf7a',
          'aqua-dark': '#199e70',
        },
      },
    },
  },
  plugins: [],
};
