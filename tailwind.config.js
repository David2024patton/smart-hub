/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Space Obsidian Background
        'deep': 'hsl(224, 71%, 4%)',
        // Translucent Slate Glass Cards
        'panel': 'hsl(222, 47%, 11%, 0.45)',
        // Emerald Green Status
        'emerald': 'hsl(142, 70%, 45%)',
        'emerald-light': 'hsl(142, 70%, 65%)', // Brighter for light theme
        // Amber Warning
        'amber': 'hsl(38, 92%, 50%)',
        'amber-light': 'hsl(38, 92%, 70%)', // Brighter for light theme
        // Polar White Text
        'polar': 'hsl(210, 40%, 98%)',
        // Light Theme Backgrounds
        'light-bg': 'hsl(210, 20%, 98%)',
        'light-panel': 'hsl(210, 20%, 95%, 0.8)',
        'light-text': 'hsl(210, 10%, 15%)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      }
    },
  },
  plugins: [],
}