var Filter = require('broccoli-filter');
var jscs = require('jscs');
var config = require('jscs/lib/cli-config');
var path = require('path');

var JSCSFilter = function(inputTree, options) {
  if (!(this instanceof JSCSFilter)) return new JSCSFilter(inputTree, options);

  this.inputTree = inputTree;
  this.enabled = true;

  options = options || {};
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key];
    }
  }

  if (this.enabled) {
    var rules = config.load(this.configPath || '.jscsrc') || {};
    if (!(this.bypass = !Object.keys(rules).length)) {
      var checker = new jscs({ esnext: !!this.esnext });
      checker.registerDefaultRules();
      checker.configure(rules);
      this.checker = checker;

      if (!this.disableTestGenerator) {
        this.targetExtension = 'jscs-test.js';
      }
    }
  }
};

JSCSFilter.prototype = Object.create(Filter.prototype);
JSCSFilter.prototype.constructor = JSCSFilter;
JSCSFilter.prototype.extensions = ['js'];
JSCSFilter.prototype.targetExtension = 'js';
JSCSFilter.prototype.processString = function(content, relativePath) {
  if (this.enabled && !this.bypass) {
    var errors = this.checker.checkString(content, relativePath);

    var errorText = this.processErrors(errors, true);
    if (errorText) {
      this.logError(errorText);
    }

    if (!this.disableTestGenerator) {
      return this.testGenerator(relativePath, errors);
    }
  }

  return content;
};

JSCSFilter.prototype.processErrors = function(errors, colorize) {
  return errors.getErrorList().map(function(error) {
    return errors.explainError(error, colorize);
  }).join('\n');
};

JSCSFilter.prototype.testGenerator = function(relativePath, errors) {
  var errorText = this.processErrors(errors, false);
  if (errorText) {
    errorText = this.escapeErrorString('\n' + errorText);
  }

  return "module('JSCS - " + path.dirname(relativePath) + "');\n" +
         "test('" + relativePath + " should pass jscs', function() { \n" +
         "  ok(" + !errorText + ", '" + relativePath + " should pass jscs." + errorText + "'); \n" +
         "});\n";
};

JSCSFilter.prototype.logError = function(message) {
  console.log(message);
};

JSCSFilter.prototype.escapeErrorString = function(string) {
  string = string.replace(/\n/gi, "\\n");
  string = string.replace(/'/gi, "\\'");

  return string;
};

module.exports = JSCSFilter;