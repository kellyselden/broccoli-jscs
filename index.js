var Filter = require('broccoli-filter');
var jscs = require('jscs');
var config = require('jscs/lib/cli-config');

var JSCSFilter = function(inputTree, options) {
  if (!(this instanceof JSCSFilter)) return new JSCSFilter(inputTree, options);

  this.inputTree = inputTree;

  var rules = !options ? {} : !options.configPath ? options : config.load(options.configPath);
  if (!(this.bypass = !Object.keys(rules).length)) {
    var checker = new jscs({ esnext: !!options.esnext });
    checker.registerDefaultRules();
    checker.configure(rules);
    this.checker = checker;
  }
};

JSCSFilter.prototype = Object.create(Filter.prototype);
JSCSFilter.prototype.constructor = JSCSFilter;
JSCSFilter.prototype.extensions = ['js'];
JSCSFilter.prototype.targetExtension = 'js';
JSCSFilter.prototype.processString = function(content, relativePath) {
  if (!this.bypass) {
    var errors = this.checker.checkString(content, relativePath);
    errors.getErrorList().forEach(function(e) {
      console.log(errors.explainError(e, true));
    });
    this.errors = errors;
  }

  return content;
};

module.exports = JSCSFilter;