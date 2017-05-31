'use strict';

module.exports = function (app) {
  // User Routes
  var follow = require('../controllers/follow.server.controller');

  // Setting up the users following api
  app.route('/api/user/follow/:userId').put(follow.followUser);
  app.route('/api/user/unfollow/:userId').put(follow.unfollowUser);
  app.route('/api/user/followers').get(follow.followers);
  app.route('/api/user/following').get(follow.following);
  app.route('/api/user/top/followers').get(follow.mostFollowers);

};
