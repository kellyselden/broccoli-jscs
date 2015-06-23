var JSCSFilter = require('broccoli-jscs');

module.exports = {
  name: 'broccoli-jscs',

  lintTree: function(type, tree) {
    return new JSCSFilter(tree, this.app.options.jscsOptions);
  }
};
