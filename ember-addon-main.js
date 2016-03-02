var JSCSFilter = require('broccoli-jscs');
var mergeTrees = require('broccoli-merge-trees');
var Funnel = require('broccoli-funnel');
var checker = require('ember-cli-version-checker');
var jsStringEscape = require('js-string-escape');

module.exports = {
  name: 'broccoli-jscs',

  shouldSetupRegistryInIncluded: function() {
    return !checker.isAbove(this, '0.1.10');
  },

  lintTree: function(type, tree) {
    var jscsOptions = this.app.options.jscsOptions || {};

    if (!jscsOptions.enabled) {
      return tree;
    }

    var project = this.project;
    if (!jscsOptions.testGenerator && project.generateTestFile) {
      jscsOptions.testGenerator = function(relativePath, errors) {
        if (errors) {
          errors = jsStringEscape('\n' + errors);
        }

        return project.generateTestFile('JSCS - ' + relativePath, [{
          name: 'should pass jscs',
          passed: !errors,
          errorMessage: relativePath + ' should pass jscs.' + errors
        }]);
      }
    }

    var jscsTree = new JSCSFilter(tree, jscsOptions);

    if (jscsTree.bypass || jscsTree.disableTestGenerator) {
      return tree;
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

          // I can't get ember-cli@0.1.10 to run to test this
          if (jscsTree === tree) {
            return tree;
          }

          return mergeTrees([
            tree,
            new Funnel(jscsTree, {
              srcDir: '/',
              destDir: outputPath + '/tests/'
            })
          ], { overwrite: true });
        }
      });
    }
  }
};
