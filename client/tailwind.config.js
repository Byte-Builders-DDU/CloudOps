/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark space palette
        space: {
          950: '#020817',
          900: '#050B1A',
          800: '#080F21',
          700: '#0D1629',
        },
        sidebar: '#070E20',
        canvas: '#050B1A',
        // Neon accent colors
        neon: {
          blue:   '#38BDF8',
          violet: '#A78BFA',
          green:  '#34D399',
          cyan:   '#22D3EE',
          amber:  '#FBBF24',
        },
        cloud: {
          aws:   '#FF9900',
          azure: '#0EA5E9',
          gcp:   '#4285F4',
        },
        primary: {
          DEFAULT:  '#3B82F6',
          hover:    '#2563EB',
        },
        ai: {
          DEFAULT: '#8B5CF6',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
        display: ['Outfit', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        glow:    '0 0 20px rgba(56,189,248,0.3), 0 0 60px rgba(56,189,248,0.1)',
        'glow-v': '0 0 20px rgba(167,139,250,0.3), 0 0 60px rgba(167,139,250,0.1)',
        drawer:  '-4px 0 40px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'count-in': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float-particle': {
          '0%':   { transform: 'translateY(0px) translateX(0px)', opacity: '0' },
          '10%':  { opacity: '1' },
          '90%':  { opacity: '0.6' },
          '100%': { transform: 'translateY(-80vh) translateX(40px)', opacity: '0' },
        },
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 8px currentColor' },
          '50%':       { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-up':        'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right':     'slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in':         'fade-in 0.4s ease forwards',
        'count-in':        'count-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-particle':  'float-particle linear infinite',
        'pulse-neon':      'pulse-neon 2s ease-in-out infinite',
        'spin-slow':       'spin-slow 8s linear infinite',
        'shimmer':         'shimmer 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
