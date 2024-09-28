/// <reference types="webpack-dev-server" />
import type { Configuration } from 'webpack'
import HTMLPlugin from 'html-webpack-plugin'
import CSSPlugin from 'mini-css-extract-plugin'
import TSConfigPathsPlugin from 'tsconfig-paths-webpack-plugin'

const configuration: Configuration = {
  context: __dirname,
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    plugins: [new TSConfigPathsPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: require.resolve('ts-loader'),
      },
      {
        test: /\.css$/,
        use: [CSSPlugin.loader, require.resolve('css-loader')],
      },
    ],
  },
  devServer: {
    server: 'https',
    hot: false,
    bonjour: false,
    liveReload: false,
    webSocketServer: false,
  },
  plugins: [
    new CSSPlugin(),
    new HTMLPlugin({
      title: 'NotCCID Example',
    }),
  ],
}

export default configuration
