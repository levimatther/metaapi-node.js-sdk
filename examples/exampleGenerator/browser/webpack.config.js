const path = require('path');

module.exports = {
  entry: './node_modules/metaapi.cloud-sdk/lib/index.es6',
  resolve: {
    extensions: ['.js', '.es6']
  },
  node: {
    fs: "empty",
    tls: "empty",
    net: "empty"
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname),
    library: 'MetaApi',
    libraryTarget: 'umd',
    libraryExport: 'default'
  }
};
