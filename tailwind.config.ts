import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lab: {
          bg: '#0a0e1a',
          panel: '#111827',
          border: '#1e293b',
          accent: '#3b82f6',
          neon: '#22d3ee',
          warn: '#f59e0b',
          error: '#ef4444',
          success: '#10b981',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
