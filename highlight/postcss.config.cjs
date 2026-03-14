const tailwindcss = require("@tailwindcss/postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

module.exports = {
  plugins: [tailwindcss(), autoprefixer, cssnano],
};
