'use strict';
/* jshint -W079 */ 

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Reply = mongoose.model('Reply'),
  Uttle = mongoose.model('Uttle'),
  oembed = require('connect-oembed'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

String.prototype.trunc = function(n, useWordBoundary){
  var isTooLong = this.length > n,
    s_ = isTooLong ? this.substr(0,n-1) : this;
  s_ = (useWordBoundary && isTooLong) ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
  return isTooLong ? s_ + '&hellip;' : s_;
};

/**
 * Create a uttle OEMBED response
 */
exports.get = function (req, res, next) {
  var urlRegEx = /^.*\/uttle\/(.*)/;
  if (req.query.url) {
    var matched = urlRegEx.exec(req.oembed.url);
    if (matched) {
      var replyId = matched[1];

      // lookup info from the db based on the reply ID (populate the uttle)
      // then compile a list of options for the link type 
      
      Reply.findById(replyId)
      .populate('uttle user')
      .exec(function(err, reply){
        if (err) {
          res.status(404).send('Uttle not found because of the following error: '+err);
          //next();
        } else if (!reply) {
          res.status(404).send('Uttle not found');
        } else {
          var opts = {
            title : reply.uttle.title,
            author_name : reply.user.displayName,
            author_url : 'http://uttles.com/p/'+reply.user.username,
            provider_name : 'Uttles.com',
            provider_url : 'http://uttles.com',
            thumbnail_url : reply.uttle.imageUrl,
            thumbnail_width : reply.uttle.imageWidth,
            thumnail_height : reply.uttle.imageHeight,
            description : reply.content.trunc(200, true)
          };
          res.oembed.link(opts); 
        }
      });
    } else {
      res.status(404).send('Uttle not found because of an invalid URL request');
    }
  } else {
    res.status(404).send('Uttle not found because no URL given');
  }
};