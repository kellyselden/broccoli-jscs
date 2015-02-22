var JSCSFilter = require('broccoli-jscs');
var mergeTrees = require('broccoli-merge-trees');
var pickFiles  = require('broccoli-static-compiler');
var checker = require('ember-cli-version-checker');

module.exports = {
  name: 'broccoli-jscs',

  shouldSetupRegistryInIncluded: function() {
    return !checker.isAbove(this, '0.1.10');
  },

  lintTree: function(type, tree) {
    var jscsTree = new JSCSFilter(tree, this.app.options.jscsOptions);

    if (!jscsTree.enabled || jscsTree.bypass || jscsTree.disableTestGenerator) {
      return;
    }

    return jscsTree;
  },

  included: function(app) {
    var addonContext = this;
    this.app = app;
    this._super.included.apply(this, arguments);

    if (app.tests && this.shouldSetupRegistryInIncluded()) {
      app.registry.add('js', {
        name: 'broccoli-jscs',
        ext: 'js',
        toTree: function(tree, inputPath, outputPath, options) {
          var jscsTree = addonContext.lintTree('unknown-type', tree);

          if (!jscsTree) {
            return tree;
          }

          return mergeTrees([
            tree,
            pickFiles(jscsTree, {
              srcDir: '/',
              destDir: outputPath + '/tests/'
            })
          ], { overwrite: true });
        }
      });
    }
  }
};
