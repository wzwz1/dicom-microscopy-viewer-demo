const path = require('path');

module.exports = {
  entry: './script.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  mode: 'development',
  resolve: {
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    fallback: {
      fs: false,
      path: require.resolve('path-browserify'),
    },
  },
  experiments: {
    asyncWebAssembly: true, // Enable WebAssembly support
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        use: 'wasm-loader',
      },
      {
        test: /\.css$/i,
        include: /node_modules|public/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.m?js$/,
        include: /node_modules/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
};