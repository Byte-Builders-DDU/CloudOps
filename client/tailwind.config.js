/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#0F172A',
        'sidebar-deep': '#020617',
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-muted': '#F1F5F9',
        border: '#E2E8F0',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-muted': '#64748B',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        ai: {
          DEFAULT: '#7C3AED',
          tint: '#F5F3FF',
        },
        success: {
          DEFAULT: '#047857',
          tint: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#B45309',
          tint: '#FFFBEB',
        },
        critical: {
          DEFAULT: '#B91C1C',
          tint: '#FEF2F2',
        },
        cloud: {
          aws: '#FF9900',
          azure: '#0078D4',
          gcp: '#4285F4',
        },
        brand: {
          primary: '#0F172A',
          accent: '#2563EB',
          accentHover: '#1D4ED8',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
          darkMuted: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        drawer: '-4px 0 24px 0 rgba(15, 23, 42, 0.15)',
        dropdown: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
