'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Uttle = mongoose.model('Uttle'),
  Reply = mongoose.model('Reply'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

// This will help as we're not using the built in "findById" and such
var ObjectId = require('mongoose').Types.ObjectId; 

  //  app.route('/api/user/profile/:username').get(profile.getUser);
exports.getUser = function (req, res) {
  User.findOne({
    username: req.params.username
  })
  .select('-salt -password -roles -email')
  .exec(function (err, user) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else if (!user) {
      res.status(404).send({
        message: 'Failed to load User ' + req.params.username
      });
    } else {
      res.json(user);
    }
  });  
};

  // app.route('/api/user/replies/:userId').get(profile.replies);
exports.replies = function (req, res) {
  var perPage = 10;
  if (req.query.perPage) {
    perPage = parseInt(req.query.perPage, 10) || 10;
  }
  var page = 0;
  if (req.query.page) {
    page = (parseInt(req.query.page, 10) - 1) || 0;
  }

  var qObj = {
    'user' : new ObjectId(req.params.userId),
    'nestedLevel' : 1
  };
  Reply.find(qObj)
  .populate({
    path: 'uttle',
    select: 'title replies replyCount imageUrl'
  })
  .sort('-created')
  .limit(perPage)
  .skip(perPage * page)
  .exec(function (err, replies) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Reply.count(qObj).exec(function(err, count) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          // totalPages : Math.trunc(count / perPage) + 1,
          var rObject = {
            replies : replies,
            total: count,
            perPage: perPage
          };
          res.json(rObject);
        }
      });
    }
  });
};

  // app.route('/api/user/top/replies').get(profile.topByReplies);
exports.topByReplies = function (req, res) {
  Reply.aggregate([
    {
      $group: {
        _id: '$user',  //$region is the column name in collection
        count: { $sum: 1 }
      }
    }, {
      $sort: { count: -1 }
    }, {
      $limit: 20
    }, {
      $project: { user: '$_id', count: 1, _id: false }
    }
  ], function (err, result) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      User.populate(result, 
        { path: 'user', model: 'User', select: '-salt -password -roles -email' },
        function (err, results) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            res.json(results);
          }
        });
    }
  });
};

  // app.route('/api/user/top/submissions').get(profile.topBySubmissions);
exports.topBySubmissions = function (req, res) {
  Uttle.aggregate([{
    $unwind: '$submitters'
  }, { 
    $group: {
      _id: '$submitters',  //$region is the column name in collection
      count: { $sum: 1 }
    }
  }, {
    $sort: { count: -1 }
  }, {
    $limit: 20
  }, {
    $project: { user: '$_id', count: 1, _id: false }
  }], function (err, result) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      User.populate(result, 
          { path: 'user', model: 'User', select: '-salt -password -roles -email' },
          function (err, results) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              res.json(results);
            }
          });
    }
  });
};
