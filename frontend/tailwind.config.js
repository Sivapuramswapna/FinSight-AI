/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: {
            bg: '#0B0F19',
            card: '#111827',
            border: '#1F2937',
            hover: '#1E293B',
            text: '#F9FAFB',
            muted: '#9CA3AF'
          },
          light: {
            bg: '#F8FAFC',
            card: '#FFFFFF',
            border: '#E2E8F0',
            hover: '#F1F5F9',
            text: '#0F172A',
            muted: '#64748B'
          },
          emerald: '#10B981',
          teal: '#14B8A6',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          rose: '#F43F5E',
          amber: '#F59E0B',
          blue: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-indigo': '0 0 20px -5px rgba(99, 102, 241, 0.3)',
      }
    },
  },
  plugins: [],
}
