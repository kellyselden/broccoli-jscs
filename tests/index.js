var jscsTree = require('..');
var expect = require('expect.js');
var root = process.cwd();

var fs = require('fs');
var path = require('path');
var broccoli = require('broccoli');

var builder;

describe('broccoli-jscs', function() {
  var loggerOutput;

  function readFile(path) {
    return fs.readFileSync(path, { encoding: 'utf8' });
  }

  beforeEach(function() {
    loggerOutput = [];
  });

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  describe('jscsrc', function() {
    it('bypass if no jscsrc file is found', function() {
      var sourcePath = 'tests/fixtures/no-jscsrc';
      var tree = new jscsTree(sourcePath, {});

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(tree.bypass).to.be.ok();
      });
    });

    it('don\'t bypass if jscsrc file is found', function() {
      var sourcePath = 'tests/fixtures/issue-found';

      var tree = new jscsTree(sourcePath);

      expect(tree.bypass).to.not.be.ok();
    });

    it('defaults to .jscsrc in source path folder', function() {
      var sourcePath = 'tests/fixtures/issue-found';

      var tree = new jscsTree(sourcePath, {
        persist: false,
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.contain('Expected indentation of 2 characters');
      });
    });

    it('uses the jscsrc as configuration', function() {
      var sourcePath = 'tests/fixtures/issue-found';

      var tree = new jscsTree(sourcePath, {
        persist: false,
        configPath: path.join(sourcePath, '.jscsrc'),
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.contain('Expected indentation of 2 characters');
      });
    });

    it('supply your own jscsrc file', function() {
      var sourcePath = 'tests/fixtures/no-jscsrc';

      var tree = new jscsTree(sourcePath, {
        persist: false,
        configPath: 'tests/fixtures/only-jscsrc/.jscsrc-with-unique-name',
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.not.eql(0);
      });
    });

    it('supply your own in code config object', function() {
      var sourcePath = 'tests/fixtures/code-config';

      var tree = new jscsTree(sourcePath, {
        persist: false,
        config: { "validateIndentation": 2 },
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.not.eql(0);
      });
    });
  });

  describe('options', function() {
    it('doesn\'t run if disabled', function() {
      var sourcePath = 'tests/fixtures/issue-found';

      var tree = new jscsTree(sourcePath, {
        persist: false,
        enabled: false,
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });

    it('runs with esnext enabled', function() {
      var sourcePath = 'tests/fixtures/esnext';

      var tree = new jscsTree(sourcePath, {
        persist: false,
        esnext: true,
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(1);
      });
    });
  });

  describe('jscs', function() {
    it('passes all rules', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';

      var tree = new jscsTree(sourcePath, {
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });

    it('finds an expected issue', function() {
      var sourcePath = 'tests/fixtures/issue-found';

      var tree = new jscsTree(sourcePath, {
        persist: false,
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.match(/Expected indentation/);
      });
    });
  });

  describe('testGenerator', function() {
    it('retains targetExtension when disableTestGenerator is true', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';

      var tree = jscsTree(sourcePath, {
        disableTestGenerator: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        expect(tree.targetExtension).to.eql('js');
      });
    });

    it('sets targetExtension correctly when disableTestGenerator is false', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';

      var tree = jscsTree(sourcePath, {});

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        expect(tree.targetExtension).to.eql('jscs-test.js');
      });
    });

    it('does not generate tests if disableTestGenerator is set', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';

      var tree = jscsTree(sourcePath, {
        disableTestGenerator: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/index.' + tree.targetExtension)).to.not.match(/ok\(true, 'index.js should pass jscs.'\);/);
      });
    });

    it('generates test files for jscs issues', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';

      var tree = jscsTree(sourcePath, {});

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/index.' + tree.targetExtension)).to.match(/ok\(true, 'index.js should pass jscs.'\);/);
      });
    });

    it('generates empty content for excluded files with test generation', function() {
      var sourcePath = 'tests/fixtures/esnext-parse-error';

      var tree = jscsTree(sourcePath);

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/bad-file.' + tree.targetExtension)).to.be('');
        expect(readFile(dir + '/another-bad-file.' + tree.targetExtension)).to.be('');
        expect(readFile(dir + '/good-file.' + tree.targetExtension)).to.match(/ok\(true, 'good-file.js should pass jscs.'\);/);
      });
    });

    it('generates original content for excluded files without test generation', function() {
      var sourcePath = 'tests/fixtures/esnext-parse-error';

      var tree = jscsTree(sourcePath, {
        disableTestGenerator: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/bad-file.' + tree.targetExtension)).to.be(readFile(sourcePath + '/bad-file.js'));
        expect(readFile(dir + '/another-bad-file.' + tree.targetExtension)).to.be(readFile(sourcePath + '/another-bad-file.js'));
        expect(readFile(dir + '/good-file.' + tree.targetExtension)).to.be(readFile(sourcePath + '/good-file.js'));
      });
    });

    it('generates test files with custom test generator', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';

      var tree = jscsTree(sourcePath, {
        testGenerator: function() {
          return 'foo';
        }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/index.' + tree.targetExtension)).to.equal('foo');
      });
    });

    it('generates test files for the mocha test framework', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';

      var tree = jscsTree(sourcePath, {
        testFramework: 'mocha'
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/index.' + tree.targetExtension)).to.match(/expect\(true, 'index.js should pass jscs.'\).to.be.ok;/);
      });
    });
  });

  describe('excludeFiles', function() {
    it('excludes single file and glob', function() {
      var sourcePath = 'tests/fixtures/excludes';

      tree = jscsTree(sourcePath, {
        persist: false,

        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.join('\n')).to.match(/function included/);
        expect(loggerOutput.join('\n')).to.not.match(/function excluded/);
      });
    });

    it('test file exclude caching - glob matching should only run once for a given relative path', function() {
      var sourcePath = 'tests/fixtures/esnext-parse-error';
      var matchesPatternCalled = 0;
      var tree;

      tree = jscsTree(sourcePath, {});
      tree.inputPaths = [sourcePath];
      tree.configure();

      tree._matchesPattern = function() {
        matchesPatternCalled++;
        return true;
      };

      expect(tree._excludeFileCache).to.be.empty();

      tree.processString(readFile(sourcePath + '/another-bad-file.js'), 'another-bad-file.js');
      tree.processString(readFile(sourcePath + '/bad-file.js'), 'bad-file.js');
      tree.processString(readFile(sourcePath + '/good-file.js'), 'good-file.js');

      expect(tree._excludeFileCache['another-bad-file.js']).to.be.ok();
      expect(tree._excludeFileCache['bad-file.js']).to.be.ok();
      expect(tree._excludeFileCache['good-file.js']).to.be.ok();
      expect(tree._excludeFileCache).to.only.have.keys('another-bad-file.js', 'bad-file.js', 'good-file.js');
      expect(matchesPatternCalled).to.be(3);

      tree.processString(readFile(sourcePath + '/another-bad-file.js'), 'another-bad-file.js');
      tree.processString(readFile(sourcePath + '/bad-file.js'), 'bad-file.js');
      tree.processString(readFile(sourcePath + '/good-file.js'), 'good-file.js');

      expect(tree._excludeFileCache).to.only.have.keys('another-bad-file.js', 'bad-file.js', 'good-file.js');
      expect(matchesPatternCalled).to.be(3);
    });
  });

  describe('escapeErrorString', function() {
    var tree;

    beforeEach(function() {
      tree = jscsTree('.', {});
    });

    it('escapes single quotes properly', function() {
      expect(tree.escapeErrorString("'")).to.equal('\\\'');
    });

    it('escapes new lines properly', function() {
      expect(tree.escapeErrorString("\n")).to.equal('\\n');
    });
  });
});
