// Example: snowpack.config.mjs
// The added "@type" comment will enable TypeScript type information via VSCode, etc.

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  root: "./src/",
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
