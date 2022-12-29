/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{htm,tsx}"],
    theme: {
      extend: {},
    },
    plugins: [require('@tailwindcss/forms')],
  }