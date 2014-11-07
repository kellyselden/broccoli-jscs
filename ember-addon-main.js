var JSCSFilter = require('broccoli-jscs');
var mergeTrees = require('broccoli-merge-trees');
var pickFiles = require('broccoli-static-compiler');

module.exports = {
  name: 'broccoli-jscs',

  included: function(app) {
    this.app = app;
    this._super.included.apply(this, arguments);

    if (app.tests) {
      app.registry.add('js', {
        name: 'broccoli-jscs',
        ext: 'js',
        toTree: function(tree, inputPath, outputPath, options) {
          var jscsTree = new JSCSFilter(tree, app.options.jscsOptions);

          if (!jscsTree.bypass && !jscsTree.disableTestGenerator) {
            jscsTree.targetExtension = 'jscs-test.js';

            return mergeTrees([
              tree,
              pickFiles(jscsTree, {
                srcDir: '/',
                destDir: outputPath + '/tests/'
              })
            ], { overwrite: true });
          }

          return tree;
        }
      });
    }
  }
};
