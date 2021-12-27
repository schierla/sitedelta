// Example: snowpack.config.mjs
// The added "@type" comment will enable TypeScript type information via VSCode, etc.

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  root: "./src/",
  workspaceRoot: "../",
  optimize: {
    entrypoints: [
      "background.js",
      "scripts/transferScript.js",
      "scripts/manage.js",
      "scripts/options.js",
      "scripts/pages.js",
      "scripts/popup.js",
      "scripts/show.js",
    ],
    bundle: true,
    treeshake: true,
    target: "es2018",
    sourcemap: false,
  },
  mount: {
    src: "/",
    "../_locales": "/_locales",
    "../common/src/styles": "/styles",
    "../common/src/icons": "/icons",
  },
  buildOptions: {
    out: "dist",
    metaUrlPath: "dependencies"
  },
  plugins: [
  ],
};
