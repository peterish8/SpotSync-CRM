import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0a0a',      // Main background
          secondary: '#121212',    // Card background
          tertiary: '#181818',     // Elevated cards
          hover: '#1a1a1a',        // Hover states
        },
        spotify: {
          green: '#1DB954',        // Primary accent
          'green-hover': '#1ed760', // Hover green
          'green-dark': '#169c46',  // Active green
        },
        text: {
          primary: '#FFFFFF',      // Main text
          secondary: '#B3B3B3',    // Muted text
          tertiary: '#6B7280',     // Disabled text
        },
        accent: {
          blue: '#3B82F6',         // Info
          red: '#EF4444',          // Error
          yellow: '#F59E0B',       // Warning
          purple: '#8B5CF6',       // K-pop tag
        },
        border: '#282828',         // Subtle borders
      },
    },
  },
  plugins: [],
};
export default config;
