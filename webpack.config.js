const path = require('path');

const config = {
  resolve: {
    extensions: ['.js', '.es6']
  },
  node: {
    fs: 'empty',
    tls: 'empty',
    net: 'empty'
  },
};

const defaultConfig = Object.assign({}, config, {
  entry: './lib/index.es6',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname),
    library: 'MetaApi',
    libraryTarget: 'umd',
    libraryExport: 'default'
  }
});

const exportsConfig = Object.assign({}, config, {
  entry: './lib/index.es6',
  output: {
    filename: 'exports.js',
    path: path.resolve(__dirname),
    library: 'MetaApiExports',
    libraryTarget: 'umd',
  }
});

module.exports = [defaultConfig, exportsConfig];
