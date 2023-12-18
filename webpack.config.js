const path = require("path");
const nodeExternals = require("webpack-node-externals");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  target: "node",
  externals: [nodeExternals()], // removes node_modules from your final bundle
  entry: "./build/server.js", // make sure this matches the main root of your code

  output: {
    path: path.join(__dirname, "build"), // this can be any path and directory you want
    filename: "server.bundle.js",
  },
  optimization: {
    minimize: false, // enabling this reduces file size and readability
  },
  context: path.resolve(__dirname),
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'static' }
      ]
    })
  ]
};
