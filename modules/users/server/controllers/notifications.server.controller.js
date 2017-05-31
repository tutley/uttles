'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

function jPrint(title, theObject) {
  console.log('*********************************************************************');
  console.log(title);
  console.log(JSON.stringify(theObject, null, 2));
  return;
}


exports.getNotifications = function (req, res) {
  var userId = req.user._id;

  User.findById(userId)
  .populate({ 
    path: 'notifications.reply',
    populate: [{
      path: 'user',
      select: 'username displayName profileImageURL',
      model: 'User'
    }, {
      path: 'uttle',
      model: 'Uttle'
    }]
  })
  .exec(function(err, user) {
    if (err) {
      //jPrint('findById error', err);
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      //jPrint('notifications ', user.notifications);
      res.json(user.notifications);
    }
  });
};

exports.markRead = function (req, res) {
  var userId = req.user._id;
  var notificationId = req.params.id;
  User.findOneAndUpdate(
    { '_id': userId, 'notifications._id': notificationId },
    { '$set' : { 'notifications.$.read' : true } }, 
    function(err, user) {
      if (err) {
        res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(user.notifications);
      }
    });
};


exports.archive = function (req, res) {
  var userId = req.user._id;
  var notificationId = req.params.id;
  User.findByIdAndUpdate(userId, {
    '$pull': {
      'notifications': { '_id' : notificationId }
    }
  }, function(err, doc) {
    if (err) {
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(doc.notifications);
    }
  });
};




