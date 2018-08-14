const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    sql_database: ['babel-polyfill', path.resolve(__dirname, 'src/sql_database.ts')]
  },
  output: {
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: /(node_modules|expo_project)/,
        resolve: {
          // Add `.ts` and `.tsx` as a resolvable extension.
          extensions: [".ts", ".tsx", ".js"]
        },
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-typescript']
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/^pg-native$/)
  ]
};
