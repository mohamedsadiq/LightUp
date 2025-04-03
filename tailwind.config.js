/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'lu-',
  corePlugins: {
    preflight: true,
  },
  content: [
    "./src/**/*.{tsx,jsx,js,ts}",
    "./src/contents/**/*.{tsx,jsx,js,ts}",
    "./src/components/**/*.{tsx,jsx,js,ts}",
    "./src/popup/**/*.{tsx,jsx,js,ts}",
    "./src/options/**/*.{tsx,jsx,js,ts}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

