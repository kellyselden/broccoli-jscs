var JSCSFilter = require('./index');

module.exports = {
  name: 'broccoli-jscs',

  included: function(app) {
    this._super.included.apply(this, arguments);

    if (app.tests) {
      app.registry.add('js', {
        name: 'broccoli-jscs',
        ext: 'js',
        toTree: function(tree) {
          return new JSCSFilter(tree, app.options.jscsOptions);
        }
      });
    }
  }
};
