'use strict';
/* jshint -W079 */ 

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Reply = mongoose.model('Reply'),
  Uttle = mongoose.model('Uttle'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a reply
 */
exports.create = function (req, res) {
  // When a new reply is created, two things have to happen:
  // 1) The reply must be created and get an Object ID
  // 2) The object ID must be inserted into the replies array of whatever
  // you are replying to, whether it is another reply or an uttle itself
  var reply = new Reply(req.body);
  reply.user = req.user;
  // First a sanity check
  if (req.body.nestedLevel > 9) {
    return res.status(400).send({
      message: 'what the sam hell is going on here? we only have comments 9 levels deep'
    });
  } else {
    reply.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        // If replyTo is not null, this is a reply to a reply and must be added to the
        // reply array of replies. If replyTo is null, this is a top level reply (a uttle)
        if (reply.replyTo) {
          Reply.findByIdAndUpdate(req.body.replyTo,
            { $push: { 'replies': reply._id } },
            { safe: true, upsert: true, new: true },
            function(err, oldReply) {
              if (err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                // increment the absolute reply count
                Uttle.findByIdAndUpdate(req.body.uttle,
                  { $inc: { 'replyCount': 1 } },
                  function (err) {
                    if (err) {
                      return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                      });
                    } else {
                      // create a new notification for the original user
                      var notify = {
                        'type': 'reply',
                        'reply': reply._id
                      };
                      User.findByIdAndUpdate(oldReply.user, 
                        { $push: { 'notifications': notify } }, 
                        { safe: true, upsert: false, new: true },
                        function(err) {
                          if (err) {
                            return res.status(400).send({
                              message: errorHandler.getErrorMessage(err)
                            });
                          } else {
                            res.json(reply);
                          }
                        });
                    }                    
                  });
              }
            });
        } else {
          Uttle.findByIdAndUpdate(req.body.uttle,
            { $push: { 'replies': reply._id },
              $inc: { 'replyCount': 1, 'submissions': 1 },
              $addToSet: { 'submitters': req.user } },
            { safe: true },
            function(err, oldReply) {
              if (err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                res.json(reply);
              }
            });
        }
      }
    });    
  }
};

/**
 * Show the current reply
 */
exports.read = function (req, res) {
  res.json(req.reply);
};

/**
 * Update a reply
 */
exports.update = function (req, res) {
  var reply = req.reply;

  reply.content = req.body.content;
  reply.edited = Date.now();

  reply.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(reply);
    }
  });
};

/**
 * Delete a reply
 */
exports.delete = function (req, res) {
  var reply = req.reply;
  // first we gotta pop it out of the array it was in
  // if replyTo is not null, it was attached to a reply
  // if replyTo is null, it was attached to a Uttle
  if (reply.replyTo) {
    Reply.findByIdAndUpdate(reply.replyTo,
      { $pull: { 'replies': reply._id } },
      { safe: true },
      function(err, oldReply) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          reply.remove(function (err) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              // lastly, decrement the absolute reply count
              Uttle.findByIdAndUpdate(reply.uttle,
                { $inc: { 'replyCount': -1 } },
                function (err) {
                  if (err) {
                    return res.status(400).send({
                      message: errorHandler.getErrorMessage(err)
                    });
                  } else {
                    res.json(reply);
                  }                    
                });
            }
          });
        }
      });  
  } else {
    Uttle.findByIdAndUpdate(reply.uttle,
      { $pull: { 'replies': reply._id },
        $inc: { 'replyCount': -1 , 'submissions': -1 } },
      { safe: true },
      function(err, oldReply) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          reply.remove(function (err) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              res.json(reply);
            }
          });
        }
      });

  }
};

/**
 * List of Replies
 */
 // TODO: decide if filtering will happen here or only in the UI
exports.list = function (req, res) {
  // This may seem counterintuitive, but we're actually going to find the uttle that matches
  // the currently viewed uttle, populate its array of replies, then send back the array of replies
  // I did it this way for speed. You could also search all of the replies in the replies collection
  // for the appropriate uttle id. I figured that would be slower.
  var sortOps = { sort: { 'created' : -1 } };

  Uttle.findOne({ '_id' : req.query.uttle })
  .populate({
    path: 'replies',
    options: sortOps,
    populate: [{
      path: 'user',
      select: 'displayName username'
    }, {
      path: 'replies',
      options: sortOps,
      populate: [{
        path: 'user',
        select: 'displayName username'
      }, {
        path: 'replies',
        options: sortOps,
        populate: [{
          path: 'user',
          select: 'displayName username'
        }, {
          path: 'replies',
          options: sortOps,
          populate: [{
            path: 'user',
            select: 'displayName username'
          }, {
            path: 'replies',
            options: sortOps,
            populate: [{
              path: 'user',
              select: 'displayName username'
            }, {
              path: 'replies',
              options: sortOps,
              populate: [{
                path: 'user',
                select: 'displayName username'
              }, {
                path: 'replies',
                options: sortOps,
                populate: [{
                  path: 'user',
                  select: 'displayName username'
                }, {
                  path: 'replies',
                  options: sortOps,
                  populate: [{
                    path: 'user',
                    select: 'displayName username'
                  }, {
                    path: 'replies',
                    options: sortOps,
                    populate: [{
                      path: 'user',
                      select: 'displayName username'
                    }, {
                      path: 'replies',
                      options: sortOps,
                      populate: {
                        path: 'user',
                        select: 'displayName username'
                      }
                    }]
                  }]
                }]
              }]
            }]
          }]
        }]
      }]
    }]
  })
  .exec(function (err, uttle) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else if (!uttle) {
      return res.status(404).send({
        message: 'No uttle with that identifier has been found'
      });
    } else {
      res.json(uttle.replies);
    }
  });
};

/**
 * Reply middleware
 */
exports.replyByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Reply is invalid'
    });
  }

  var sortOps = { sort: { 'created' : -1 } };

  Reply.findById(id)
  .populate([{
    path: 'uttle',
    populate: {
      path: 'user',
      model: 'User',
      select: 'displayName'
    }
  }, {
    path: 'user',
    select: 'displayName username'
  }, {
    path: 'replies',
    options: sortOps,
    populate: [{
      path: 'user',
      select: 'displayName username'
    }, {
      path: 'replies',
      options: sortOps,
      populate: [{
        path: 'user',
        select: 'displayName username'
      }, {
        path: 'replies',
        options: sortOps,
        populate: [{
          path: 'user',
          select: 'displayName username'
        }, {
          path: 'replies',
          options: sortOps,
          populate: [{
            path: 'user',
            select: 'displayName username'
          }, {
            path: 'replies',
            options: sortOps,
            populate: [{
              path: 'user',
              select: 'displayName username'
            }, {
              path: 'replies',
              options: sortOps,
              populate: [{
                path: 'user',
                select: 'displayName username'
              }, {
                path: 'replies',
                options: sortOps,
                populate: [{
                  path: 'user',
                  select: 'displayName username'
                }, {
                  path: 'replies',
                  options: sortOps,
                  populate: [{
                    path: 'user',
                    select: 'displayName username'
                  }, {
                    path: 'replies',
                    options: sortOps,
                    populate: [{
                      path: 'user',
                      select: 'displayName username'
                    }]
                  }]
                }]
              }]
            }]
          }]
        }]
      }]
    }]
  }])
  .exec(function (err, reply) {
    if (err) {
      return next(err);
    } else if (!reply) {
      return res.status(404).send({
        message: 'No reply with that identifier has been found'
      });
    }
    req.reply = reply;
    next();
  });
};
