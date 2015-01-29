var jscsTree = require('..');
var expect = require('expect.js');
var root = process.cwd();

var fs = require('fs');
var broccoli = require('broccoli');

var builder;

describe('broccoli-jscs', function() {
  var loggerOutput;

  function readFile(path) {
    return fs.readFileSync(path, { encoding: 'utf8' });
  }

  function chdir(path) {
    process.chdir(path);
  }

  beforeEach(function() {
    chdir(root);

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
      chdir(sourcePath);

      var tree = new jscsTree('.', {});

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(tree.bypass).to.be.ok();
      });
    });

    it('don\'t bypass if jscsrc file is found', function() {
      var sourcePath = 'tests/fixtures/issue-found';
      chdir(sourcePath);

      var tree = new jscsTree('.', {
        logError: function() {}
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(tree.bypass).to.not.be.ok();
      });
    });

    it('uses the jscsrc as configuration', function() {
      var sourcePath = 'tests/fixtures/issue-found';
      chdir(sourcePath);

      var tree = new jscsTree('.', {
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.not.eql(0);
      });
    });

    it('supply your own jscsrc file', function() {
      var sourcePath = 'tests/fixtures/no-jscsrc';
      chdir(sourcePath);

      var tree = new jscsTree('.', {
        configPath: '../only-jscsrc/.jscsrc',
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
      chdir(sourcePath);

      var tree = new jscsTree('.', {
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
      chdir(sourcePath);

      var tree = new jscsTree('.', {
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
      chdir(sourcePath);

      var tree = new jscsTree('.', {
        logError: function(message) { loggerOutput.push(message); }
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function() {
        expect(loggerOutput.length).to.eql(0);
      });
    });

    it('finds an expected issue', function() {
      var sourcePath = 'tests/fixtures/issue-found';
      chdir(sourcePath);

      var tree = new jscsTree('.', {
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
      chdir(sourcePath);

      var tree = jscsTree('.', {
        disableTestGenerator: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        expect(tree.targetExtension).to.eql('js');
      });
    });

    it('sets targetExtension correctly when disableTestGenerator is false', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';
      chdir(sourcePath);

      var tree = jscsTree('.', {});

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        expect(tree.targetExtension).to.eql('jscs-test.js');
      });
    });

    it('does not generate tests if disableTestGenerator is set', function() {
      var sourcePath = 'tests/fixtures/no-issues-found';
      chdir(sourcePath);

      var tree = jscsTree('.', {
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
      chdir(sourcePath);

      var tree = jscsTree('.', {});

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/index.' + tree.targetExtension)).to.match(/ok\(true, 'index.js should pass jscs.'\);/);
      });
    });

    it('generates empty content for excluded files with test generation', function() {
      var sourcePath = 'tests/fixtures/esnext-parse-error';
      chdir(sourcePath);

      var tree = jscsTree('.');

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/bad-file.' + tree.targetExtension)).to.be('');
        expect(readFile(dir + '/bad-files/exclude-me.' + tree.targetExtension)).to.be('');
        expect(readFile(dir + '/good-file.' + tree.targetExtension)).to.match(/ok\(true, 'good-file.js should pass jscs.'\);/);
      });
    });

    it('generates original content for excluded files without test generation', function() {
      var sourcePath = 'tests/fixtures/esnext-parse-error';
      chdir(sourcePath);

      var tree = jscsTree('.', {
        disableTestGenerator: true
      });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var dir = results.directory;
        expect(readFile(dir + '/bad-file.' + tree.targetExtension)).to.be(readFile('bad-file.js'));
        expect(readFile(dir + '/good-file.' + tree.targetExtension)).to.be(readFile('good-file.js'));
      });
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
