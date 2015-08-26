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
    var jscsOptions = this.app.options.jscsOptions;

    if (jscsOptions && jscsOptions.disabled) {
      return tree;
    }

    var jscsTree = new JSCSFilter(tree, jscsOptions);

    if (jscsTree.bypass || jscsTree.disableTestGenerator) {
      return tree;
    }

    return jscsTree;
  },

  included: function(app) {
    this._super.included.apply(this, arguments);

    if (app.tests && this.shouldSetupRegistryInIncluded()) {
      var _this = this;
      app.registry.add('js', {
        name: 'broccoli-jscs',
        ext: 'js',
        toTree: function(tree, inputPath, outputPath, options) {
          _this.app = app;
          var jscsTree = _this.lintTree('unknown-type', tree);

          // I can't get ember-cli@0.1.10 to run to test this
          if (jscsTree === tree) {
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
