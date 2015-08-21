'use strict';

var Filter    = require('broccoli-filter');
var jscs      = require('jscs');
var config    = require('jscs/lib/cli-config');
var path      = require('path');
var minimatch = require('minimatch');

var symlinkOrCopySync = require('symlink-or-copy').sync;
var jsStringEscape = require('js-string-escape');

function _makeDictionary() {
  var cache = Object.create(null);
  cache['_dict'] = null;
  delete cache['_dict'];
  return cache;
}

var JSCSFilter = function(inputTree, options) {
  if (!(this instanceof JSCSFilter)) { return new JSCSFilter(inputTree, options); }
  this._files = _makeDictionary();

  this.inputTree = inputTree;
  this.enabled = true;

  this._excludeFileCache = _makeDictionary();

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
JSCSFilter.prototype.processFile = function(srcDir, destDir, relativePath) {
  var key = srcDir + '/' + relativePath;
  var entry=  this._cache[relativePath];
  if (entry && entry.cacheFiles[0]) {

    var cacheFilePath = this.getCacheDir() + '/' + entry.cacheFiles[0];
    var relativePath = relativePath.replace(/\.js$/, '.jscs-test.js');
    symlinkOrCopySync(cacheFilePath, destDir + '/' + relativePath);
  } else {
    return Filter.prototype.processFile.call(this, srcDir, destDir, relativePath);
  }
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

  return "module('JSCS - " + path.dirname(relativePath) + "');\n" +
         "test('" + relativePath + " should pass jscs', function() {\n" +
         "  ok(" + !errors + ", '" + relativePath + " should pass jscs." + errors + "');\n" +
         "});\n";
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

module.exports = JSCSFilter;
