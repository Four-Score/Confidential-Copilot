const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    popup: './src/popup.tsx',
    content: './src/content.tsx',
    background: './src/background.js',
    auth: './src/auth.tsx', // ✅ Add auth entry
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
  
    // Generate popup.html from template
    new HtmlWebpackPlugin({
      template: './src/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
  
    // Generate auth.html from static template
    new HtmlWebpackPlugin({
      template: './public/auth.html', // Use static HTML as base
      filename: 'auth.html',
      chunks: ['auth'], // Only inject auth.js
    }),
  
    // Copy all public files except auth.html to avoid conflict
    new CopyPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          filter: (resourcePath) => !resourcePath.endsWith('auth.html'), // ⛔ Skip auth.html
        },
      ],
    }),
  
    new webpack.DefinePlugin({
      'process.env.GROQ_API_KEY': JSON.stringify(process.env.GROQ_API_KEY || ''),
    }),
  ],  
};
