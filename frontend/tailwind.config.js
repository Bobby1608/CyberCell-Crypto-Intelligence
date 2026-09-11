/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      colors: {
        'surface-canvas':  '#0B192C',
        'surface-panel':   '#0F172A',
        'surface-elevated':'#1E293B',
        'border-muted':    '#334155',
        'ink-primary':     '#F8FAFC',
        'ink-secondary':   '#94A3B8',
        'accent-crimson':  '#DC2626',
        'accent-saffron':  '#D97706',
        'accent-emerald':  '#10B981',
        'accent-cyan':     '#06B6D4',
        obsidian: {
          DEFAULT: "#070B12",
          surface: "#0B111E",
          elevated: "#0F172A",
          border: "rgba(255, 255, 255, 0.08)",
          borderStrong: "rgba(255, 255, 255, 0.16)"
        },
        sovereign: {
          saffron: "#D97706",
          saffronMuted: "#B45309",
          emerald: "#10B981",
          cyan: "#06B6D4"
        }
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '4px',
        md: '4px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
