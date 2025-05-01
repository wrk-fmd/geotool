const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: ['./src/app.ts', './src/styles.scss'],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.s?css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", {
          loader: "sass-loader",
          options: {
            sassOptions: {
              // SASS prints a lot of deprecation warnings for Bootstrap now,
              // but hiding them is probably not a good idea in the long run
              quietDeps: true,
              silenceDeprecations: [
                // SASS imports will need to be replaced at some point,
                // but probably won't be possible before Bootstrap 6
                'import',
              ],
            }
          }
        }],
      },
      {
        test: /\.(png|jpg|gif|svg|ttf|woff2?|eot)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name][ext][query]"
        }
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      template: "./src/index.html",
    }),
    new MiniCssExtractPlugin({})
  ],
  performance: {
    maxAssetSize: 1048576,
    maxEntrypointSize: 524288,
  },
};
