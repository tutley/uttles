'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  oembed = require('connect-oembed'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Module init function.
 */
module.exports = function (app, db) {

  // Inject Oembed middleware
  app.use('/api/reply/oembed', oembed(function(req, res, next) {
    next();
  }));

};
