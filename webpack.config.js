const path = require('path');

module.exports = {
  entry: {
    app: './src/app.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  externals: {
    'azure-devops-extension-sdk': 'SDK',
    'azure-devops-extension-api': 'API'
  },
  mode: process.env.NODE_ENV || 'development'
};
