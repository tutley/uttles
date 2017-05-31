'use strict';

module.exports = function (app) {
  // User Routes
  var notifications = require('../controllers/notifications.server.controller');

  // Setting up the users following api
  app.route('/api/user/notifications').get(notifications.getNotifications);
  app.route('/api/user/notification/:id').put(notifications.markRead);
  app.route('/api/user/notification/:id').delete(notifications.archive);
};