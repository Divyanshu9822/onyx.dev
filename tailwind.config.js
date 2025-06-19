/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Onyx Theme Colors
        onyx: {
          // Neutrals (Base & Backgrounds)
          'bg-primary': '#F7F3ED',     // Light parchment / stone wall feel
          'bg-secondary': '#E6DCD1',   // Warmer clay tone
          'surface': '#FFFFFF',        // Clean readable zones
          'border': '#C4B9AB',         // Soft stone edging feel
          
          // Earth Tones (Primary UI Colors)
          'primary': '#D97706',        // Burnt orange / clay (warm action)
          'primary-hover': '#F59E0B',  // Brighter terracotta hover glow
          'secondary': '#A16207',      // Darker amber / mud tone
          'warning': '#92400E',        // Rich brown (alerts, strong outlines)
          
          // AI-Themed Glow Accents
          'accent': '#7DD3FC',         // Sky-blue glow hinting AI intelligence
          'highlight': '#38BDF8',      // Neon-ish cyan (for outlines, input)
          'link': '#0EA5E9',           // Clean actionable blue
          
          // Text & Typography
          'text-primary': '#1F2937',   // Deep slate gray
          'text-secondary': '#4B5563', // Muted charcoal
          'text-disabled': '#9CA3AF',  // Light gray stone tone
        }
      }
    },
  },
  plugins: [],
};