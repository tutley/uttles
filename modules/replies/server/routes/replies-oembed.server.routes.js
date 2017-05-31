'use strict';

/**
 * Module dependencies.
 */
var repliesOembed = require('../controllers/replies-oembed.server.controller');

module.exports = function (app) {
  // Replies collection routes
  app.route('/api/reply/oembed')
    .get(repliesOembed.get);
};