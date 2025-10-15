/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'mediq-blue': '#0564F5',
        'mediq-light-blue': '#639AE9',
        'mediq-red': '#EA4758',
        'mediq-text-black': '#404040',
        'mediq-dark-grey': '#9C9D9E',
        'mediq-light-grey': '#C5C4C5',
        'mediq-lightest-grey': '#EFEFEF',
        'mediq-lightest-blue': '#D0E4FF'
      },
    },
  },
  plugins: [],
}