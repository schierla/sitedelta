const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

module.exports = {
  plugins: [tailwindcss("./tailwind.config.cjs"), autoprefixer, cssnano],
};
