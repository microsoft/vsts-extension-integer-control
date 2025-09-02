const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const isDevelopment = process.env.NODE_ENV !== 'production';

const plugins = [
  new CopyWebpackPlugin({
    patterns: [
      { from: "index.html", to: "index.html" },
      { from: "styles", to: "styles" },
      { from: "img", to: "img" }
    ]
  })
];

module.exports = {
  devtool: isDevelopment ? "inline-source-map" : "source-map",
  entry: {
    app: './src/app.ts'
  },
  output: {
    publicPath: "/dist/",
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: plugins,
  mode: isDevelopment ? 'development' : 'production',
  devServer: {
    server: 'https',
    port: 3000,
    open: false,
    hot: true,
    static: {
      directory: path.join(__dirname, './'), 
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  }
};
