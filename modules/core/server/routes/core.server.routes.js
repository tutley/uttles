'use strict';

module.exports = function (app) {
  // Root routing
  var core = require('../controllers/core.server.controller');

  // Define error pages
  app.route('/server-error').get(core.renderServerError);

  // Define static uttle page
  // /perma/:replyId
  app.route('/perma/:replyId').get(core.renderPermaUttle);

  // TODO: add uttle route so the uttles are statically served
  // Return a 404 for all undefined api, module or lib routes
  app.route('/:url(api|perma|modules|lib)/*').get(core.renderNotFound);

  // Define application route
  app.route('/*').get(core.renderIndex);
};
