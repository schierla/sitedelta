import { resolve } from "path";
import WebExtPlugin from "web-ext-plugin";
import CopyPlugin from "copy-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
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
      pages: "./src/view/pages.tsx",
      manage: "./src/view/manage.tsx",
      options: "./src/view/options.tsx",
      popup: "./src/view/popup.tsx",
      transferScript: "./src/view/transferScript.ts",
      contentScript: "./src/view/contentScript.ts",
      highlightScript: "./src/view/highlightScript.ts",
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
          loader: "esbuild-loader",
          options: {
            target: "es2015"
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
      minimize: false
    },

    plugins: [
      new webpack.DefinePlugin({
        USE_SCRIPTING_EXECUTE_SCRIPT: env.target === "chrome",
      }),
      new CopyPlugin({
        patterns: [
          { from: "../common/src/icons/*", to: "icons/[name][ext]" },
          { from: "../_locales/**/*", to: "_locales/[path][name][ext]" },
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
