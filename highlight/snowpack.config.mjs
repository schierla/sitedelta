// Example: snowpack.config.mjs
// The added "@type" comment will enable TypeScript type information via VSCode, etc.

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  root: "./src/",
  optimize: {
    entrypoints: [
      "scripts/background.js",
      "scripts/contentScript.js",
      "scripts/highlightScript.js",
      "scripts/transferScript.js",
      "scripts/manage.js",
      "scripts/options.js",
      "scripts/pages.js",
      "scripts/popup.js",
    ],
    bundle: true,
    treeshake: false,
    target: "es2018",
    sourcemap: false,
  },
  workspaceRoot: "../",
  mount: {
    src: "/",
    "../_locales": "/_locales",
    "../common/src/styles": "/styles",
    "../common/src/icons": "/icons",
  },
  buildOptions: {
    out: "dist",
  },
  plugins: [
  ],
};
