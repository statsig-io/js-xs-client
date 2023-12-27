const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./src/Statsig.js",
  output: {
    filename: "Statsig.min.js",
    path: __dirname + "/dist",
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
