import { resolve } from "path";
import WebExtPlugin from "web-ext-plugin";
import CopyPlugin from "copy-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { ESBuildMinifyPlugin } from "esbuild-loader";
import webpack from "webpack";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export default (env) => {
  if (env.target != "chrome" && env.target != "firefox")
    throw new Error("Please set target to 'chrome' or 'firefox'");

  return {
    mode: "production",
    entry: {
      background: "./src/background.ts",
      "scripts/pages": "./src/scripts/pages.tsx",
      "scripts/manage": "./src/scripts/manage.tsx",
      "scripts/options": "./src/scripts/options.tsx",
      "scripts/popup": "./src/scripts/popup.tsx",
      "scripts/transferScript": "./src/scripts/transferScript.ts",
      "scripts/contentScript": "./src/scripts/contentScript.ts",
      "scripts/highlightScript": "./src/scripts/highlightScript.ts",
    },
    output: {
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
          loader: "babel-loader",
          options: {
            presets: ["@babel/typescript"],
            plugins: [
              [
                "@babel/plugin-transform-react-jsx",
                { runtime: "classic", pragma: "h" },
              ],
            ],
          },
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
        },
        {
          test: /\.svg$/i,
          type: "asset/inline",
        },
      ],
    },

    optimization: {
      minimize: env.package === "true",
      minimizer: [new ESBuildMinifyPlugin()],
    },

    plugins: [
      new webpack.DefinePlugin({
        USE_SCRIPTING_EXECUTE_SCRIPT: env.target === "chrome",
      }),
      new CopyPlugin({
        patterns: [
          { from: "../common/src/icons/*", to: "icons/[name][ext]" },
          // { from: "../common/src/styles/*", to: "styles/[name][ext]" },
          { from: "../_locales/**/*", to: "_locales/[path][name][ext]" },
          // { from: "src/styles/*", to: "styles/[name][ext]" },
          { from: "src/*.htm", to: "[name][ext]" },
          { from: `src/${env.target}.manifest.json`, to: "manifest.json" },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: "tailwind.bundle.css",
      }),
      new WebExtPlugin({
        sourceDir: resolve(__dirname, "dist", env.target),
        target: env.target === "chrome" ? "chromium" : "firefox-desktop",
        buildPackage: env.package === "true",
        artifactsDir: `../build/${env.target}`,
        runLint: env.target !== "chrome",
      }),
    ],

    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
