var Filter = require('broccoli-filter');
var jscs = require('jscs');
var config = require('jscs/lib/cli-config');

var JscsFilter = function(inputTree, options) {
  if (!(this instanceof JscsFilter)) return new JscsFilter(inputTree, options);

  this.inputTree = inputTree;

  var rules = !options ? {} : !options.configPath ? options : config.load(options.configPath);
  if (!(this.bypass = !Object.keys(rules).length)) {
    var checker = new jscs({esnext: !!options.esnext});
    checker.registerDefaultRules();
    checker.configure(rules);
    this.checker = checker;
  }
};

JscsFilter.prototype = Object.create(Filter.prototype);
JscsFilter.prototype.constructor = JscsFilter;
JscsFilter.prototype.extensions = ['js'];
JscsFilter.prototype.targetExtension = 'js';
JscsFilter.prototype.processString = function(content, relativePath) {
  if (!this.bypass) {
    var errors = this.checker.checkString(content, relativePath);
    errors.getErrorList().forEach(function(e) {
      console.log(errors.explainError(e, true));
    });
  }

  return content;
};

module.exports = JscsFilter;