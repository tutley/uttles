'use strict';

// Replies controller
angular.module('replies')
.run(['$anchorScroll', function($anchorScroll) {
  $anchorScroll.yOffset = 50;   // always scroll by 50 extra pixels
}])
.controller('RepliesController', ['$scope', '$stateParams', '$anchorScroll', '$location', 'Authentication', 'Replies', 'RecursionHelper', 
  function ($scope, $stateParams, $anchorScroll, $location, Authentication, Replies, RecursionHelper) {
    $scope.authentication = Authentication;
    // Init the new top level reply Form
    $scope.topReply = {};
    $scope.topReplyCollapsed = true;
    $scope.topReplyAvailable = (Authentication.user);
    $scope.previewIsCollapsed = true; // don't show the preview html by default
    $scope.everyone = true; //show all replies by default
    var scrollTo = $stateParams.scrollTo;
    $scope.replies = [];

    // function scrollToReply() {
    //   if ($stateParams.scrollTo) {
    //     var newHash = 'reply' + scrollTo;
    //     console.log(newHash);
    //     $location.hash(newHash);
    //     $anchorScroll();
    //     $location.hash(null);
    //   }
    // }

    $scope.$watch('replies', function(newValue, oldValue) {
      if (newValue.$resolved) {
        var newHash = 'reply' + scrollTo;
        $location.hash(newHash);
        $anchorScroll();
        $location.hash(null);
      }
    });

    // There is probably a better way to do this. I'm using these helper functions
    // in conjunction with the ui.bootsrap "collapse" tag to show/hide things
    $scope.showReplyForm = function(replyId) {
      if (!Authentication.user) {
        $location.path('/authentication/signin');
      }
      $scope.currentReplyId = replyId;  
    };
    $scope.cancelReply = function() {
      $scope.currentReplyId = null;
    };

    $scope.prepareDelete = function(replyId) {
      $scope.replyToDelete = replyId;  
    };
    $scope.cancelDelete = function() {
      $scope.replyToDelete = null;
    };

    $scope.prepareEdit = function(reply) {
      reply.newContent = reply.content;
      $scope.replyToEdit = reply._id;  
    };
    $scope.cancelEdit = function() {
      $scope.replyToEdit = null;
    };

    // show all replies
    $scope.showAll = function() {
      $scope.everyone = true;
    };
    
    // show only replies of people you follow
    $scope.showFollowing = function() {
      $scope.everyone = false;
    };


    // $scope.prepareReport = function(replyId) {
    //   $scope.replyToReport = replyId;  
    // };
    // End show/hide stuff

    // CRUD Operations
    // Create new Reply where replyId is the _id of the reply we're replying to
    $scope.create = function (currentReply) {
      currentReply.error = null;
      // First make sure there's actually something in the reply
      // TODO: provide an error or feedback somehow
      if (!currentReply.newReply) {
        currentReply.error = 'The reply was empty!';
        return false;
      }
      // Now check that they haven't somehow replied to a level 9 reply
      var newReplyLevel = currentReply.nestedLevel + 1;
      if (newReplyLevel > 9) {
        currentReply.error = 'how the hell did you do that?';
        return false;
      }

      // Construct a new reply to send to the api
      var reply = new Replies({
        content: currentReply.newReply,
        uttle: currentReply.uttle,
        replyTo: currentReply._id,
        nestedLevel: newReplyLevel
      });

      // Use resource to hit the server api, then push the reply into the current view
      reply.$save(function (response) {
        currentReply.replies.unshift(response); 
        currentReply.newReply='';
        $scope.currentReplyId = null;
      }, function (errorResponse) {
        currentReply.error = errorResponse.data.message;
      });
    };

    // Remove existing Reply
    $scope.remove = function (reply) {
      if (reply) {
        var deadManWalking = new Replies(reply);
        deadManWalking.$remove({},
          //success
          function(value){
            // brute force method of removing the reply from view
            // $scope.find();

            // TODO: find a way to remove this one directive rather than just collapsing it
            reply.isDeleted = true;
          },
          //error
          function(error){
            reply.error = error.data.message;
          }
        );
      }
    };

    // Update existing Reply
    $scope.update = function (currentReply) {
      currentReply.error = null;

      if (!currentReply.newContent) {
        currentReply.error = 'The reply was empty!';
        return false;
      }
      if (currentReply.newContent === currentReply.content) {
        currentReply.error = 'You did not change anything!';
        return false;
      }

      var reply = new Replies(currentReply);
      reply.content = currentReply.newContent;

      reply.$update(function (response) {
        currentReply.content = response.content;
        currentReply.edited = response.edited;
        $scope.replyToEdit = null;
      }, function (errorResponse) {
        currentReply.error = errorResponse.data.message;
      });
    };

    // Find a list of Replies
    $scope.find = function () {
      var uttleId = $stateParams.uttleId;
      $scope.showAll();
      Replies.query({ 'uttle' : uttleId }, function(response) {  
        $scope.replies = response;
        // Init Toggles 
        // TODO: do this reply toggle init better
        $scope.isCollapsed = {};
        //scrollToReply();
        angular.forEach($scope.replies, function(reply){
          $scope.isCollapsed[reply._id] = false;
          angular.forEach(reply.replies, function(reply){
            $scope.isCollapsed[reply._id] = false;
            angular.forEach(reply.replies, function(reply){
              $scope.isCollapsed[reply._id] = false;
              angular.forEach(reply.replies, function(reply){
                $scope.isCollapsed[reply._id] = false;
                angular.forEach(reply.replies, function(reply){
                  $scope.isCollapsed[reply._id] = false;
                  angular.forEach(reply.replies, function(reply){
                    $scope.isCollapsed[reply._id] = false;
                    angular.forEach(reply.replies, function(reply){
                      $scope.isCollapsed[reply._id] = false;
                      angular.forEach(reply.replies, function(reply){
                        $scope.isCollapsed[reply._id] = false;
                        angular.forEach(reply.replies, function(reply){
                          $scope.isCollapsed[reply._id] = false;
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });    
    };

    // Find existing Reply
    $scope.findOne = function () {
      $scope.showAll();
      Replies.get({
        replyId: $stateParams.replyId
      }, function(reply) {
        $scope.isCollapsed = {};
        $scope.reply = reply;
        // check the list of submitters to see if this user already made a uttle about this
        if (reply.uttle.submitters.indexOf(Authentication.user._id) > -1) {
          $scope.topReplyAvailable = false;
        }
        //scrollToReply();
        angular.forEach(reply.replies, function(reply){
          $scope.isCollapsed[reply._id] = false;
          angular.forEach(reply.replies, function(reply){
            $scope.isCollapsed[reply._id] = false;
            angular.forEach(reply.replies, function(reply){
              $scope.isCollapsed[reply._id] = false;
              angular.forEach(reply.replies, function(reply){
                $scope.isCollapsed[reply._id] = false;
                angular.forEach(reply.replies, function(reply){
                  $scope.isCollapsed[reply._id] = false;
                  angular.forEach(reply.replies, function(reply){
                    $scope.isCollapsed[reply._id] = false;
                    angular.forEach(reply.replies, function(reply){
                      $scope.isCollapsed[reply._id] = false;
                      angular.forEach(reply.replies, function(reply){
                        $scope.isCollapsed[reply._id] = false;
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }, function(response){
        if(response.status === 404) {
          $location.path('/not-found');
        }
        if(response.status === 400) {
          $location.path('/bad-request');
        }
      });
    };
  }
]);

