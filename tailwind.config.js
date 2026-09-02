/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        polar: {
          bg: '#05080d',
          surface: '#0b111a',
          raised: '#101924',
          border: '#1d2a38',
          borderLight: '#26374a',
        },
        ice: {
          DEFAULT: '#5ecbf0',
          soft: '#8fdcf5',
          dim: '#2b4a5c',
        },
        status: {
          safe: '#3ecf8e',
          moderate: '#e8c547',
          high: '#f0923d',
          critical: '#f0525a',
          info: '#5ecbf0',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'polar-grid':
          'linear-gradient(rgba(94,203,240,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(94,203,240,0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
