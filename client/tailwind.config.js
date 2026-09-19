/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0F172A',  // Main dark / sidebar / primary headings
          accent: '#2563EB',   // Main accent blue
          accentHover: '#1D4ED8',
          bg: '#F8FAFC',       // Application background
          card: '#FFFFFF',     // Card surfaces
          border: '#E2E8F0',   // Border lines
          muted: '#64748B',    // Subdued secondary text
          darkMuted: '#334155',
        },
        cloud: {
          aws: '#FF9900',
          azure: '#0078D4',
          gcp: '#4285F4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        dropdown: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
