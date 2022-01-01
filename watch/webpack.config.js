const { resolve } = require("path");
const WebExtPlugin = require("web-ext-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { ESBuildMinifyPlugin } = require("esbuild-loader");
const { DefinePlugin } = require("webpack");
const path = require("path");

module.exports = (env) => {
  if (env.target != "chrome" && env.target != "firefox")
    throw new Error("Please set target to 'chrome' or 'firefox'");

  return {
    mode: "production",
    entry: {
      background:
        env.target == "chrome"
          ? "./src/backgroundWorker.ts"
          : "./src/backgroundScript.ts",
      "scripts/pages": "./src/scripts/pages.tsx",
      "scripts/manage": "./src/scripts/manage.tsx",
      "scripts/options": "./src/scripts/options.tsx",
      "scripts/popup": "./src/scripts/popup.ts",
      "scripts/show": "./src/scripts/show.ts",
      "scripts/transferScript": "./src/scripts/transferScript.ts",
    },
    output: {
      libraryTarget: "commonjs",
      path: path.resolve(__dirname, "dist", env.target),
      filename: "[name].js",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        "@sitedelta/common": resolve(__dirname, "../common"),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "esbuild-loader",
          options: {
            loader: "tsx",
            target: "es2015",
            jsxFactory: "h",
          },
        },
        {
          test: /\.css$/i,
          use: [
            "style-loader",
            "css-loader",
            {
              loader: "esbuild-loader",
              options: {
                loader: "css",
                minify: true,
              },
            },
          ],
        },
      ],
    },

    optimization: {
      minimizer: [new ESBuildMinifyPlugin()],
    },

    plugins: [
      new DefinePlugin({
        USE_SCRIPTING_EXECUTE_SCRIPT: false,
      }),
      new CopyPlugin({
        patterns: [
          { from: "../common/src/icons/*", to: "icons/[name][ext]" },
          { from: "../common/src/styles/*", to: "styles/[name][ext]" },
          { from: "../_locales/**/*", to: "_locales/[path][name][ext]" },
          { from: "src/styles/*", to: "styles/[name][ext]" },
          { from: "src/*.htm", to: "[name][ext]" },
          { from: `src/${env.target}.manifest.json`, to: "manifest.json" },
        ],
      }),
      new WebExtPlugin({
        sourceDir: resolve(__dirname, "dist", env.target),
        target: env.target === "chrome" ? "chromium" : "firefox-desktop",
        buildPackage: env.package === "true",
        artifactsDir: `../build/${env.target}`
      }),
    ],

    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
