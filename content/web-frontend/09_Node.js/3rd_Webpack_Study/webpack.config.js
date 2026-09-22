const path = require('path')
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
  entry: path.resolve(__dirname, './src/login/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: './login/index.js',
    clean: true, // 在生成文件之前清空 output 目录
  },
  // 插件（给 Webpack提供更多功能）
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/login.html"), // 模板文件
      filename: path.resolve(__dirname, "dist/login/index.html") // 输出文件
    }),
    new MiniCssExtractPlugin()
  ],
  // 加载器（让 webpack识别更多模块文件内容）
  module: {
    rules: [
      {
        test: /\.css$/i,
        // use: ['style-loader', 'css-loader'],
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset',
        generator: {
          filename: 'assets/[hash][ext][query]'
        }
      },
    ],
  },
  // 优化
  optimization: {
    // 最小化
    minimizer: [
      // 在 webpack@5 中，你可以使用 `...` 语法来扩展现有的 minimizer（即 `terser-webpack-plugin`），将下一行取消注释（保证 JS代码还能压缩）
      `...`,
      new CssMinimizerPlugin(),
    ],
  },
}