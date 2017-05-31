'use strict';

module.exports = function (app) {
  // User Routes
  var profile = require('../controllers/profile.server.controller');

  // Setting up the users profile api
  app.route('/api/user/profile/:username').get(profile.getUser);
  app.route('/api/user/replies/:userId').get(profile.replies);
  app.route('/api/user/top/replies').get(profile.topByReplies);
  app.route('/api/user/top/submissions').get(profile.topBySubmissions);
};
