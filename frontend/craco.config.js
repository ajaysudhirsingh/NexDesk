const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Disable source map warnings for node_modules
      webpackConfig.ignoreWarnings = [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes('node_modules') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ];

      // Disable source map loader for node_modules
      const sourceMapLoaderRule = webpackConfig.module.rules.find(
        (rule) => rule.loader && rule.loader.includes('source-map-loader')
      );
      
      if (sourceMapLoaderRule) {
        sourceMapLoaderRule.exclude = /node_modules/;
      }

      if (process.env.DISABLE_HOT_RELOAD === 'true') {
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (plugin) => plugin.constructor.name !== 'HotModuleReplacementPlugin'
        );
        webpackConfig.watch = false;
        webpackConfig.watchOptions = { ignored: /.*/ };
      }
      
      return webpackConfig;
    },
  },
};
