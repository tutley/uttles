'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Uttle = mongoose.model('Uttle'),
  Reply = mongoose.model('Reply'),
  oembed = require('oembed'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  _ = require('lodash'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

oembed.EMBEDLY_KEY = config.embedly.key;
var ObjectId = require('mongoose').Types.ObjectId; 

/**
 * Create a uttle
 * I'm using node-oembed and embedly to get url summaries, for now.
 * I may do my own function for this ability using:
 * http://noodlejs.com/
 * https://github.com/jbrooksuk/node-summary
 * And maybe some other tools, like imgur for thumbnails
 */
exports.create = function (req, res, next) {
 /**
  *  Unlike other social sites, Uttles does not let the user actually input anything about the
  *  url, other than the url and some tags. So the create function tries to do it all.
  *
  * The Strategy here is to use oEmbed with Embedly as a fallback to fetch summaries of urls.
  * This will return an object that contains the data we need to describe a url fully. 
  *
  * The first thing we will do when the create is called is to search the Uttle collection for
  * this existing URL.
  * If the URL is already there, go to the next step where the user writes their uttle
  * If the URL is not already there, use node-oembed to fetch a url descriptive object. Use this
  * object to populate the data in the Uttle object.
  */
  // First, look in the uttles collection for existing uttle with this url
  // 
  // TODO: look into trimming the end of the URL of odd things after a # or something
  // Note that the stuff after ? probably shouldn't be trimmed because of params
  var url = req.body.url;
  Uttle.findOne({ 'url' : url }, function (err, thisUttle) {
    if (err) {
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      }); 
      //console.log('Uttle lookup error: ' + JSON.stringify(err, null, 2));   
      next(err);
    } else if (!thisUttle) {
      // We are all clear, time to find information on the url and create the entry
      // https://github.com/astro/node-oembed
      oembed.fetch(url, { maxwidth: 1920, for: 'uttles.com' }, function(error, result) {
        if (error) {
          console.error(error);
          console.log('oembed error: ' + JSON.stringify(error, null, 2));
          console.log('oembed error result: ' + JSON.stringify(result, null, 2));
          res.status(400);
          next(err);
        } else {
          var uttle = new Uttle(req.body);
          console.log(JSON.stringify(result, null, 2));
          uttle.contentType = result.type;
          uttle.title = result.title;
          uttle.user = req.user;
          uttle.provider = {
            name : result.provider_name,
            url : result.provider_url
          };
          uttle.imageUrl = result.thumbnail_url;
          uttle.imageHeight = result.thumbnail_height;
          uttle.imageWidth = result.thumbnail_width;
          uttle.summary = result.description;
          // Determine what to store for the contentHtml based on the content type
          switch(result.type) {
            case 'photo' :
              uttle.contentHtml = '<img src="' + result.url + '" border="0" class="autoimage">';
              break;
            case 'video' :
              uttle.contentHtml = result.html;
              break;
            case 'rich' :
              uttle.contentHtml = result.html;
              break;
          }         
          // now write to the database
          uttle.save(function(err) {
            if (err) {
              res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
              //console.log('uttle save error: ' + JSON.stringify(err, null, 2));
              //next(err);
            } else {
              var response = {
                existed : false,
                uttle : uttle
              };
              res.json(response);
            }
          });
        }
      });
    } else {
    // The thisUttle was already there.
      thisUttle.lastHit = Date.now();
      thisUttle.save(function(err) {
        if (err) {
          //console.log('uttle already there error: ' + JSON.stringify(err, null, 0));
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          var response = {
            existed : true,
            uttle : thisUttle
          };
          res.json(response);
        }
      });        
    }
  });
};

/**
 * Show the current uttle
 */
exports.read = function (req, res) {
  res.json(req.uttle);
};

/**
 * Update a uttle
 */
exports.update = function (req, res) {
  var uttle = req.uttle;
  if ((req.body.title !== uttle.title || req.body.summary !== uttle.summary) && !(req.user.roles.indexOf('admin' > -1))) {
    res.status(403);
    return;
  }
  uttle.title = req.body.title;
  uttle.summary = req.body.summary;
  uttle.tags = _.union(uttle.tags, req.body.tags);
  uttle.lastHit = Date.now();

  if (uttle.tags.length > 12) {
    uttle.tags = _.slice(uttle.tags, 0, 12);
  }

  if (!uttle.title) {
    return res.status(400).send({
      message: 'There must be a title for the Uttle!'
    });
  } else if (!uttle.summary) {
    return res.status(400).send({
      message: 'There must be a summary for the Uttle!'
    });    
  } else {
    uttle.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(uttle);
      }
    });
  }
};

/**
 * Delete an uttle
 */
exports.delete = function (req, res) {
  var uttle = req.uttle;

  uttle.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Reply.remove({ uttle: new ObjectId(uttle._id) }, function(err, count){
        console.log('Removed ' + count.n + 'replies along with uttle id ' + uttle._id);
        res.json(uttle);          
      });
    }
  });
};

/**
 * List of Uttles
 */
exports.list = function (req, res) {
  //This has been edited to allow for searching

  // console.log('******************** QUERY PARAMETERS ******************');
  // console.log(JSON.stringify(req.query, null, 2));
  // console.log('******************** /QUERY PARAMETERS *****************');

    // Pagination stuff
  var perPage = 10;
  if (req.query.perPage) {
    perPage = parseInt(req.query.perPage, 10) || 10;
  }

  var qObject = {};
  var sortBy = '-created';
  if (req.query.sort !== 'created') {
    sortBy = '-' + req.query.sort + ' ' + sortBy;
  }
  var sevenDaysAgo = new Date(Date.now() - (1000*60*60*24*7));

  // If this is a search add the text search
  if (req.query.search) {
    qObject.$text = { $search : req.query.search };
  } 

  // if this is a tag search add the tag match
  if (req.query.tag) {
    qObject.tags = { $regex : new RegExp(req.query.tag, 'i') };
  } 

  // if they want to limit it to just uttles from people they're following
  if (req.query.everyone === '0') {
    // create an array containing you the user plus the people you're following
    var filterArr = req.user.following;
    filterArr.push(req.user._id);
    qObject.submitters = { $in : filterArr };
  }

  // If there is a time limit, add it in
  if (req.query.alltime === '0') {
    qObject.created = { $gt : sevenDaysAgo };
  }

  //console.log('qObject: ' + JSON.stringify(qObject, null, 2));
  // Page 1  is actually Page 0 for the database, so subtract 1
  var page = (Math.abs(parseInt(req.query.page), 10) || 1) - 1;
  // Now run the query based on the variable input.
  Uttle.find(qObject)
  .limit(perPage)
  .skip(perPage * page)
  .sort(sortBy)
  .populate('user', 'displayName username')
  .exec(function (err, uttles) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Uttle.count(qObject).exec(function(err, count) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          // totalPages : Math.trunc(count / perPage) + 1,
          var rObject = {
            content : uttles,
            totalUttles: count,
            perPage : perPage
          };
          res.json(rObject);
        }
      });
    }
  });
  
};

/**
 * Uttle middleware
 */
exports.uttleByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Uttle is invalid'
    });
  }

  Uttle.findById(id).populate('user', 'displayName').exec(function (err, uttle) {
    if (err) {
      return next(err);
    } else if (!uttle) {
      return res.status(404).send({
        message: 'No uttle with that identifier has been found'
      });
    }
    req.uttle = uttle;
    next();
  });
};
