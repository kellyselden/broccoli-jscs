'use strict';

var Filter    = require('broccoli-persistent-filter');
var jscs      = require('jscs');
var config    = require('jscs/lib/cli-config');
var path      = require('path');
var minimatch = require('minimatch');
var stringify = require('json-stable-stringify');
var crypto    = require('crypto');
var findup    = require('findup-sync');

var jsStringEscape = require('js-string-escape');

function _makeDictionary() {
  var cache = Object.create(null);
  cache['_dict'] = null;
  delete cache['_dict'];
  return cache;
}

var JSCSFilter = function(inputTree, _options) {
  if (!(this instanceof JSCSFilter)) { return new JSCSFilter(inputTree, _options); }

  var options = _options || {};
  if (!options.hasOwnProperty('persist')) {
    options.persist = true;
  }

  Filter.call(this, inputTree, options);

  this.options = options;
  this.inputTree = inputTree;
  this.enabled = true;

  this._excludeFileCache = _makeDictionary();

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key];
    }
  }

};

JSCSFilter.prototype = Object.create(Filter.prototype);
JSCSFilter.prototype.constructor = JSCSFilter;
JSCSFilter.prototype.extensions = ['js'];
JSCSFilter.prototype.targetExtension = 'js';

JSCSFilter.prototype.baseDir = function() {
  return __dirname;
};

JSCSFilter.prototype.build = function () {
  this.configure();
  return Filter.prototype.build.call(this);
};

JSCSFilter.prototype.configure = function () {
  if (this.enabled) {
    this.rules = this.loadRules(this.inputPaths[0]);

    this.bypass = Object.keys(this.rules).length === 0;
    if (!this.bypass) {
      var checker = new jscs();
      checker.registerDefaultRules();
      checker.configure(this.rules);
      this.checker = checker;

      if (!this.disableTestGenerator) {
        this.targetExtension = 'jscs-test.js';
      }
    }
  }
};

JSCSFilter.prototype.loadRules = function (rootPath) {
  return config.load(this.configPath || this.findJSCSRC(rootPath)) || this.config || {};
};

JSCSFilter.prototype.findJSCSRC = function (rootPath) {
  return findup('.jscsrc', {cwd: rootPath, nocase: true});
};

JSCSFilter.prototype.processString = function(content, relativePath) {
  if (this.enabled && !this.bypass) {
    if (this.shouldExcludeFile(relativePath)) {
      return this.disableTestGenerator ? content : '';
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

  if (this.testFramework === 'mocha') {
    return "describe('JSCS - " + relativePath + "', function() {\n" +
           "  it('should pass jscs', function() {\n" +
           "    expect(" + !errors + ", '" + relativePath + " should pass jscs." + errors + "').to.be.ok;\n" +
           "  });\n" +
           "});\n";

  } else {
    return "module('JSCS - " + path.dirname(relativePath) + "');\n" +
           "test('" + relativePath + " should pass jscs', function() {\n" +
           "  ok(" + !errors + ", '" + relativePath + " should pass jscs." + errors + "');\n" +
           "});\n";
  }
};

JSCSFilter.prototype.logError = function(message) {
  console.log(message);
};

JSCSFilter.prototype.escapeErrorString = jsStringEscape;

JSCSFilter.prototype.shouldExcludeFile = function(relativePath) {
  if (this.rules.excludeFiles) {
    // The user specified an "excludeFiles" list.
    // Must pattern match or find a cache hit to determine if this relativePath is an actual JSCS exclusion.
    var excludeFileCache = this._excludeFileCache;

    if (excludeFileCache[relativePath] !== undefined) {
      // This relativePath is in the cache, so we've already run minimatch.
      return excludeFileCache[relativePath];
    }

    var i, l, pattern;

    // This relativePath is NOT in the cache. Execute _matchesPattern().
    for (i = 0, l = this.rules.excludeFiles.length; i < l; i++) {
      pattern = this.rules.excludeFiles[i];
      if (this._matchesPattern(relativePath, pattern)) {
        // User has specified "excludeFiles" and this relativePath did match at least 1 exclusion.
        return excludeFileCache[relativePath] = true;
      }
    }

    // User has specified excludeFiles but this relativePath did NOT match any exclusions.
    excludeFileCache[relativePath] = false;
  }

  // The user has NOT specified an "excludeFiles" list. Continue processing like normal.
  return false;
};

JSCSFilter.prototype._matchesPattern = function(relativePath, pattern) {
  return minimatch(relativePath, pattern);
};

JSCSFilter.prototype.optionsHash  = function() {
  if (!this._optionsHash) {
    this._optionsHash = crypto.createHash('md5')
      .update(stringify(this.options), 'utf8')
      .update(stringify(this.rules) || '', 'utf8')
      .update(this.testGenerator.toString(), 'utf8')
      .update(this.logError.toString(), 'utf8')
      .update(this.escapeErrorString.toString(), 'utf8')
      .digest('hex');
  }

  return this._optionsHash;
};

JSCSFilter.prototype.cacheKeyProcessString = function(string, relativePath) {
  return this.optionsHash() + Filter.prototype.cacheKeyProcessString.call(this, string, relativePath);
};

module.exports = JSCSFilter;
