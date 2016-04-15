broccoli-jscs
=============

[![npm version](https://badge.fury.io/js/broccoli-jscs.svg)](http://badge.fury.io/js/broccoli-jscs)
[![Build Status](https://travis-ci.org/kellyselden/broccoli-jscs.svg?branch=master)](https://travis-ci.org/kellyselden/broccoli-jscs)
[![Build status](https://ci.appveyor.com/api/projects/status/w2yk4p8c1mtu1c96/branch/master?svg=true)](https://ci.appveyor.com/project/kellyselden/broccoli-jscs/branch/master)
[![Dependency Status](https://david-dm.org/kellyselden/broccoli-jscs.svg)](https://david-dm.org/kellyselden/broccoli-jscs)
[![devDependency Status](https://david-dm.org/kellyselden/broccoli-jscs/dev-status.svg)](https://david-dm.org/kellyselden/broccoli-jscs#info=devDependencies)
[![Code Climate](https://codeclimate.com/github/kellyselden/broccoli-jscs/badges/gpa.svg)](https://codeclimate.com/github/kellyselden/broccoli-jscs)
[![Coverage Status](https://coveralls.io/repos/kellyselden/broccoli-jscs/badge.svg?branch=master)](https://coveralls.io/r/kellyselden/broccoli-jscs?branch=master)

Broccoli plugin for [jscs](https://github.com/jscs-dev/node-jscs)

## Usage

```js
var jscs = require('broccoli-jscs');

// assuming someTree is a built up tree
var tree = jscs(someTree);
// or
var tree = jscs('folderName');
```

As a Ember CLI Addon, simply `npm install --save-dev broccoli-jscs` and supply the options you would like:

```js
var app = new EmberApp({
  jscsOptions: {
    configPath: '/my/path/.jscsrc',
    enabled: true,
    disableTestGenerator: false
  }
});
```

You can also supply the options in the `.jscsrc` file if you wish:

```js
{
  "excludeFiles": ["path/to/file"],
  // more rules...
}
```

## Documentation

### `jscs(inputTree, options)`

---

`options.configPath` *{String}*

Will look in the root of the provided tree for a `.jscsrc`. Use this option if you would like to use a `.jscsrc`
file from a different path.

Default: **'.jscsrc'**

---

`options.config` *{Object}*

Specify the options for JSCS programatically, accepts the same kind of JSON
style object as you would provide in the `.jscsrc` file. This option will be
overriden when a `.jscsrc` file is in the root or when `options.configPath` is
set.

Default: **'{}'**

---

`options.enabled` *{true|false}*

This will eliminate processing altogether.

Default: **false**

---

`options.logError` *{Function}*

The function used to log to console. You can provide a custom function to log anywhere, perhaps a file or web service.

The function receives the following argument:

* `message` - A generated string of errors found.

---

`options.disableTestGenerator` *{true|false}*

If `true` tests will not be generated.

Default: **false**

---

`options.testFramework` *{String}*

This setting determines what kind of tests are generated. If a custom `testGenerator` is set `testFramework` will be ignored.

This setting currently supports the following test frameworks:

* `qunit` *(default)*
* `mocha`

---

`options.testGenerator` *{Function}*

The function used to generate test modules. You can provide a custom function for your client side testing framework of choice.

The function receives the following arguments:

* `relativePath` - The relative path to the file being tested.
* `errors` - A generated string of errors found.

Default generates QUnit style tests:

```js
var path = require('path');

function(relativePath, errors) {
  return "module('JSCS - " + path.dirname(relativePath) + "');\n" +
         "test('" + relativePath + " should pass jscs', function() {\n" +
         "  ok(" + !errors + ", '" + relativePath + " should pass jscs." + errors + "');\n" +
         "});\n";
};
```

---

`options.excludeFiles` *{String}*

Exclude files or directories from processing. Supports globbing. Example:

```js
var app = new EmberApp({
  jscsOptions: {
    excludeFiles: ['ember-runtime/ext/rsvp.js']
    // or
    excludeFiles: ['webclient/tests/**']
  }
});
```

## Tests

Running the tests:

```
npm install
npm test
```
