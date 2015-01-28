var Filter = require('broccoli-filter');
var jscs = require('jscs');
var config = require('jscs/lib/cli-config');
var path = require('path');
var minimatch = require('minimatch');

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
    this.rules = config.load(this.configPath || '.jscsrc') || {};
    if (!(this.bypass = !Object.keys(this.rules).length)) {
      var checker = new jscs({ esnext: !!this.esnext });
      checker.registerDefaultRules();
      checker.configure(this.rules);
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
    if (this.rules.excludeFiles) {
      var excludeMatch = this.rules.excludeFiles.filter(function(excludeFileMatcher) {
        return minimatch(relativePath, excludeFileMatcher);
      });
      if(excludeMatch && excludeMatch.length) {
        return this.disableTestGenerator ? content : '';
      }
    }

    var errors = this.checker.checkString(content, relativePath);

    var errorText = this.processErrors(errors, true);
    if (errorText) {
      this.logError(errorText);
    }

    if (!this.disableTestGenerator) {
      errorText = this.processErrors(errors, false);
      return this.testGenerator(relativePath, errorText);
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
  if (errors) {
    errors = this.escapeErrorString('\n' + errors);
  }

  return "module('JSCS - " + path.dirname(relativePath) + "');\n" +
         "test('" + relativePath + " should pass jscs', function() {\n" +
         "  ok(" + !errors + ", '" + relativePath + " should pass jscs." + errors + "');\n" +
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
