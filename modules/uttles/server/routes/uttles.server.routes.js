'use strict';

/**
 * Module dependencies.
 */
var uttlesPolicy = require('../policies/uttles.server.policy'),
  uttles = require('../controllers/uttles.server.controller');

module.exports = function (app) {
  // Uttles collection routes
  app.route('/api/uttles').all(uttlesPolicy.isAllowed)
    .get(uttles.list)
    .post(uttles.create);

  // Single uttle routes
  app.route('/api/uttles/:uttleId').all(uttlesPolicy.isAllowed)
    .get(uttles.read)
    .put(uttles.update)
    .delete(uttles.delete);

  // Finish by binding the uttle middleware
  app.param('uttleId', uttles.uttleByID);
};
