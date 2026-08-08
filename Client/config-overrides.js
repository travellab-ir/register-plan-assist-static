const path = require('path');
const { override, removeModuleScopePlugin, babelInclude, addWebpackAlias, addBabelPlugins } = require('customize-cra');

function fixMjsModules(config) {
  config.module.rules.unshift({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  });
  return config;
}

module.exports = {
  webpack: override(
    fixMjsModules,
    addBabelPlugins('@babel/plugin-proposal-optional-chaining', '@babel/plugin-proposal-nullish-coalescing-operator', '@babel/plugin-transform-modules-commonjs'),
    removeModuleScopePlugin(),
    babelInclude([path.resolve('src'), path.resolve('../Core')]),
    addWebpackAlias({ src: path.resolve('./src'), '@core': path.resolve('../Core') })
  ),
  devServer: function(configFunction) {
    return function(proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      //TODO: See if you can implement proxy here instead of src/setupProxy.js file.
      return config;
    };
  }
};
