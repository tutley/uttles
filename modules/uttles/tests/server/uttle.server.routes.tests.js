'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Uttle = mongoose.model('Uttle'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, uttle;

/**
 * Uttle routes tests
 */
describe('Uttle CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new uttle
    user.save(function () {
      uttle = {
        title: 'Uttle Title',
        content: 'Uttle Content'
      };

      done();
    });
  });

  it('should be able to save an uttle if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new uttle
        agent.post('/api/uttles')
          .send(uttle)
          .expect(200)
          .end(function (uttleSaveErr, uttleSaveRes) {
            // Handle uttle save error
            if (uttleSaveErr) {
              return done(uttleSaveErr);
            }

            // Get a list of uttles
            agent.get('/api/uttles')
              .end(function (uttlesGetErr, uttlesGetRes) {
                // Handle uttle save error
                if (uttlesGetErr) {
                  return done(uttlesGetErr);
                }

                // Get uttles list
                var uttles = uttlesGetRes.body;

                // Set assertions
                (uttles[0].user._id).should.equal(userId);
                (uttles[0].title).should.match('Uttle Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an uttle if not logged in', function (done) {
    agent.post('/api/uttles')
      .send(uttle)
      .expect(403)
      .end(function (uttleSaveErr, uttleSaveRes) {
        // Call the assertion callback
        done(uttleSaveErr);
      });
  });

  it('should not be able to save an uttle if no title is provided', function (done) {
    // Invalidate title field
    uttle.title = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new uttle
        agent.post('/api/uttles')
          .send(uttle)
          .expect(400)
          .end(function (uttleSaveErr, uttleSaveRes) {
            // Set message assertion
            (uttleSaveRes.body.message).should.match('Title cannot be blank');

            // Handle uttle save error
            done(uttleSaveErr);
          });
      });
  });

  it('should be able to update an uttle if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new uttle
        agent.post('/api/uttles')
          .send(uttle)
          .expect(200)
          .end(function (uttleSaveErr, uttleSaveRes) {
            // Handle uttle save error
            if (uttleSaveErr) {
              return done(uttleSaveErr);
            }

            // Update uttle title
            uttle.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing uttle
            agent.put('/api/uttles/' + uttleSaveRes.body._id)
              .send(uttle)
              .expect(200)
              .end(function (uttleUpdateErr, uttleUpdateRes) {
                // Handle uttle update error
                if (uttleUpdateErr) {
                  return done(uttleUpdateErr);
                }

                // Set assertions
                (uttleUpdateRes.body._id).should.equal(uttleSaveRes.body._id);
                (uttleUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of uttles if not signed in', function (done) {
    // Create new uttle model instance
    var uttleObj = new Uttle(uttle);

    // Save the uttle
    uttleObj.save(function () {
      // Request uttles
      request(app).get('/api/uttles')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single uttle if not signed in', function (done) {
    // Create new uttle model instance
    var uttleObj = new Uttle(uttle);

    // Save the uttle
    uttleObj.save(function () {
      request(app).get('/api/uttles/' + uttleObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', uttle.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single uttle with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/uttles/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Uttle is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single uttle which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent uttle
    request(app).get('/api/uttles/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No uttle with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an uttle if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new uttle
        agent.post('/api/uttles')
          .send(uttle)
          .expect(200)
          .end(function (uttleSaveErr, uttleSaveRes) {
            // Handle uttle save error
            if (uttleSaveErr) {
              return done(uttleSaveErr);
            }

            // Delete an existing uttle
            agent.delete('/api/uttles/' + uttleSaveRes.body._id)
              .send(uttle)
              .expect(200)
              .end(function (uttleDeleteErr, uttleDeleteRes) {
                // Handle uttle error error
                if (uttleDeleteErr) {
                  return done(uttleDeleteErr);
                }

                // Set assertions
                (uttleDeleteRes.body._id).should.equal(uttleSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an uttle if not signed in', function (done) {
    // Set uttle user
    uttle.user = user;

    // Create new uttle model instance
    var uttleObj = new Uttle(uttle);

    // Save the uttle
    uttleObj.save(function () {
      // Try deleting uttle
      request(app).delete('/api/uttles/' + uttleObj._id)
        .expect(403)
        .end(function (uttleDeleteErr, uttleDeleteRes) {
          // Set message assertion
          (uttleDeleteRes.body.message).should.match('User is not authorized');

          // Handle uttle error error
          done(uttleDeleteErr);
        });

    });
  });

  it('should be able to get a single uttle that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new uttle
          agent.post('/api/uttles')
            .send(uttle)
            .expect(200)
            .end(function (uttleSaveErr, uttleSaveRes) {
              // Handle uttle save error
              if (uttleSaveErr) {
                return done(uttleSaveErr);
              }

              // Set assertions on new uttle
              (uttleSaveRes.body.title).should.equal(uttle.title);
              should.exist(uttleSaveRes.body.user);
              should.equal(uttleSaveRes.body.user._id, orphanId);

              // force the uttle to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the uttle
                    agent.get('/api/uttles/' + uttleSaveRes.body._id)
                      .expect(200)
                      .end(function (uttleInfoErr, uttleInfoRes) {
                        // Handle uttle error
                        if (uttleInfoErr) {
                          return done(uttleInfoErr);
                        }

                        // Set assertions
                        (uttleInfoRes.body._id).should.equal(uttleSaveRes.body._id);
                        (uttleInfoRes.body.title).should.equal(uttle.title);
                        should.equal(uttleInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Uttle.remove().exec(done);
    });
  });
});
