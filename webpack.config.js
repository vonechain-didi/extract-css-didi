const path = require('path');

module.exports = {
  entry: './core/index.js',
  output: {
    libraryTarget: 'umd',
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',{
                  modules: "umd"
                }
              ]
            ],
            plugins: [
              '@babel/plugin-transform-runtime'
            ]
          }
        }
      }
    ]
  }
  
};