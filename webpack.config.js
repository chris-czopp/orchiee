const webpack = require('webpack')
const path = require('path')

module.exports = {
  target: 'web',
  entry: {
    index: [
      path.resolve(__dirname, './src/index.ts')
    ]
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, './babel.config.js')
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      React: 'react'
    })
  ],
  output: {
    filename: 'bundles/[name].bundle.js',
    chunkFilename: 'bundles/[name]-[chunkhash].chunk.js',
    path: path.resolve(__dirname, './dist/'),
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.mjs']
  },
  ...(process.env.NODE_ENV === 'local'
    ? {
      devtool: 'source-map'
    }
    : {})
}
