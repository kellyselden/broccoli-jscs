var Filter = require('broccoli-filter');
var jscs = require('jscs');
var config = require('jscs/lib/cli-config');
var path = require('path');

var JSCSFilter = function(inputTree, options) {
  if (!(this instanceof JSCSFilter)) return new JSCSFilter(inputTree, options);

  this.inputTree = inputTree;

  var rules = !options ? {} : !options.configPath ? options : config.load(options.configPath);
  if (!(this.bypass = !Object.keys(rules).length)) {
    var checker = new jscs({esnext: !!options.esnext});
    checker.registerDefaultRules();
    checker.configure(rules);
    this.checker = checker;
  }
};

JSCSFilter.prototype = Object.create(Filter.prototype);
JSCSFilter.prototype.constructor = JSCSFilter;
JSCSFilter.prototype.extensions = ['js'];
JSCSFilter.prototype.targetExtension = 'jscs-test.js';
JSCSFilter.prototype.processString = function(content, relativePath) {
  if (!this.bypass) {
    var errors = this.checker.checkString(content, relativePath);
    errors.getErrorList().forEach(function(e) {
      console.log(errors.explainError(e, true));
    });

    if (!this.disableTestGenerator) {
      return this.testGenerator(relativePath, errors);
    }
  }

  return content;
};

JSCSFilter.prototype.testGenerator = function(relativePath, errors) {
  var errorText = '';
  errors.getErrorList().forEach(function(e) {
    errorText += errors.explainError(e, false) + '\n';
  });
  if (errorText) {
    errorText = this.escapeErrorString('\n' + errorText);
  }

  return "module('JSCS - " + path.dirname(relativePath) + "');\n" +
         "test('" + relativePath + " should pass jscs', function() { \n" +
         "  ok(" + !errorText + ", '" + relativePath + " should pass jscs." + errorText + "'); \n" +
         "});\n";
};

JSCSFilter.prototype.escapeErrorString = function(string) {
  string = string.replace(/\n/gi, "\\n");
  string = string.replace(/'/gi, "\\'");

  return string;
};

module.exports = JSCSFilter;