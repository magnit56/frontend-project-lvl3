const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// const onChange = import('on-change');
// const yup = require('yup');
// import onChange from 'on-change';
// const { uniqueId } = require('lodash-es');
// const i18n = require('i18next');
// const axios = require('axios');
// const onChange = require('on-change');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
        ],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader'],
      },
      {
        test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'url-loader?limit=10000',
      },
      {
        test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
        use: 'file-loader',
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      _: 'lodash',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      i18n: 'i18next',
      axios: 'axios',
      yup: 'yup',
      lodashEs: 'lodash-es',
      // 'on-change': 'on-change',
      // uniqueId: uniqueId,
      // 'on-change': 'on-change',
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new MiniCssExtractPlugin({
      filename: './src/styles.css',
    }),
    new CleanWebpackPlugin(),
  ],
};
