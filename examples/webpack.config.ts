/// <reference types="webpack-dev-server" />
import type { Configuration } from 'webpack'
import HTMLPlugin from 'html-webpack-plugin'
import CSSPlugin from 'mini-css-extract-plugin'
import TSConfigPathsPlugin from 'tsconfig-paths-webpack-plugin'

const MAIN_ENTRY = 'main'
const RECOVERY_ENTRY = 'recovery'

const configuration: Configuration = {
  context: __dirname,
  devtool: 'source-map',
  entry: {
    [MAIN_ENTRY]: require.resolve('./src/index.tsx'),
    [RECOVERY_ENTRY]: require.resolve('./src/recovery.tsx'),
  },
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
      filename: 'index.html',
      title: 'NotCCID Example',
      chunks: [MAIN_ENTRY],
    }),
    new HTMLPlugin({
      filename: 'recovery.html',
      title: 'ESTKme-RED Recovery Tools',
      chunks: [RECOVERY_ENTRY],
    }),
  ],
}

export default configuration
