/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F5F1',
        surface: '#FFFFFF',
        forest: {
          DEFAULT: '#315C4A',
          dark: '#244537',
          light: '#3D715B',
          hover: '#284C3D',
        },
        sage: {
          DEFAULT: '#6F8F78',
          light: '#8DA895',
          dark: '#56725F',
        },
        slate: {
          dark: '#26332D',
        },
        mineral: {
          DEFAULT: '#69756F',
          light: '#94A099',
          dark: '#4D5852',
        },
        accent: {
          DEFAULT: '#E8EFE9',
          hover: '#DCE6DD',
          dark: '#C7D7CA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(38, 51, 45, 0.05), 0 1px 2px -1px rgba(38, 51, 45, 0.05)',
        'card': '0 4px 6px -1px rgba(38, 51, 45, 0.04), 0 2px 4px -2px rgba(38, 51, 45, 0.04)',
        'modal': '0 20px 25px -5px rgba(38, 51, 45, 0.08), 0 8px 10px -6px rgba(38, 51, 45, 0.08)',
      },
    },
  },
  plugins: [],
}
