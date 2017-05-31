'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

// This will help as we're not using the built in "findById" and such
//var ObjectId = require('mongoose').Types.ObjectId; 
function jPrint(title, theObject) {
  console.log('*********************************************************************');
  console.log(title);
  console.log(JSON.stringify(theObject, null, 2));
  return;
}

  //  app.route('/api/user/follow/:userId').put(follow.followUser);
exports.followUser = function (req, res) {
  var userId = req.params.userId;
  console.log('User to follow: ' + userId);
  //  applicable user fields: following: [], numFollowing, numFollowers
  //  To follow a user, we take the logged-in user's profile and insert the userId of the
  //  user to follow into the following array. Then increment the numFollowing value
  //  Then we go to the user of the userId and we increment their numFollowers value
  User.findById(req.user._id, function(err, user) {
    if (err) {
      //jPrint('findById error', err);
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if (user.following.indexOf(userId) > -1) {
        // user is already followed
        //jPrint('user already followed', user.following);
        res.status(412).send({
          message: 'This user is already being followed.'
        });
      } else {
        // do the actual following
        user.following.push(userId);
        user.numFollowing++;
        user.save(function(err, user) {
          if (err) {
            //jPrint('save error', err);
            res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            // Now increment the numFollowers for the followed user
            //jPrint('user saved', user);
            User.findOneAndUpdate({ '_id': userId },
              { $inc : { 'numFollowers' : 1 } }, 
              function(err, followed) {
                if (err) {
                  //jPrint('followed user error', err);
                  res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                } else {
                  //jPrint('followed user success', followed);
                  res.json(user);
                }
              });
          }
        });
      }
    }
  });
};

  //  app.route('/api/user/unfollow/:userId').put(follow.unfollowUser);
exports.unfollowUser = function (req, res) {
  var userId = req.params.userId;
  // to unfollow, we need to remove the user from the "following" array, then decrement
  // both this users numFollowing fields and the target user's numFollowers field.

  console.log('User to unfollow: ' + userId);

  User.findById(req.user._id, function(err, user) {
    if (err) {
      //jPrint('findById error', err);
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      var uIndex = user.following.indexOf(userId);
      if (uIndex > -1) {
        // user is followed, change that
        user.following.splice(uIndex, 1);
        user.numFollowing--;
        user.save(function(err, user) {
          if (err) {
            //jPrint('save error', err);
            res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            // Now decrement the numFollowers for the followed user
            //jPrint('user saved', user);
            User.findOneAndUpdate({ '_id': userId },
              { $inc : { 'numFollowers' : -1 } }, 
              function(err, followed) {
                if (err) {
                  //jPrint('unfollowed user error', err);
                  res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                } else {
                  //jPrint('unfollowed user success', followed);
                  res.json(user);
                }
              });
          }
        });
      } else {
        // user wasn't already followed
        //jPrint('user was not  followed', user.following);
        res.status(412).send({
          message: 'This user was not being followed.'
        });
      }
    }
  });
};

  //  app.route('/api/user/followers').get(follow.followers);
exports.followers = function (req, res) {
  // find in the users collection anyone who has req.user._id in their following array
  User.find({ 'following' : req.user._id })
  .exec(function(err, users) {
    if (err) {
      //jPrint('followers error', err);
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      //jPrint('followers', users);
      res.json(users);
    }
  });
};

  //  app.route('/api/user/following').get(follow.following);
exports.following = function (req, res) {
  // populate everyone in the following array for this user
  User.findById(req.user._id)
  .populate('following')
  .exec(function(err, user) {
    if (err) {
      //jPrint('following error', err);
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      //jPrint('following', user.following);
      res.json(user.following);
    }
  });
};

  // app.route('/api/user/top/followers').get(follow.mostFollowers);
exports.mostFollowers = function (req, res) {
  // find all in Users and return the top 20 sorted by numFollowers
  User.find({})
  .limit(20)
  .sort('-numFollowers')
  .exec(function(err, users) {
    if (err) {
      //jPrint('mostfollowers error', err);
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      //jPrint('mostfollowers', users);
      res.json(users);
    }
  });
};







