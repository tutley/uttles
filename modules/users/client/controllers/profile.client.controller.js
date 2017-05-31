'use strict';

angular.module('users').controller('ProfilesController', ['$scope', '$stateParams', '$location', 'Profiles', 'Follow', 'Authentication', '$http',
  function ($scope, $stateParams, $location, Profiles, Follow, Authentication, $http) {
    $scope.user = Authentication.user;
    $scope.currentPage = 1;
    $scope.error = null;
    $scope.repliesError = null;
    $scope.perPage = 10;
    $scope.totalPages = Math.ceil($scope.totalReplies/$scope.perPage) || 1;


    // This is where we will have methods to display user profiles
    // Fetch a user's profile
    function applyProfile(profile) {
      $scope.profile = profile;
      // determine if we're following this user
      if (Authentication.user.following.indexOf(profile._id) > -1) {
        $scope.isFollowed = true;
      }
      if (Authentication.user._id === profile._id) {
        $scope.isMe = true;
      }
      $scope.userReplies(1);
    }
    
    $scope.findByUsername = function () {
      Profiles.findByUsername($stateParams.username)
      .then(function(profile){
        applyProfile(profile);
      }, function(errorMessage){
        $scope.error = errorMessage;
      });
    };

    // Fetch a user's top level replies and associated uttles
    function applyReplies(rObject) {
      $scope.theReplies = rObject.replies;
      $scope.perPage = rObject.perPage;
      $scope.totalReplies = rObject.total;
      $scope.totalPages = Math.ceil($scope.totalReplies/$scope.perPage);
    }

    $scope.userReplies = function (pageTo) {
      var userId = $scope.profile._id;
      var page = pageTo || 1;
      var perPage = $scope.perPage;

      Profiles.userReplies(pageTo, perPage, userId)
      .then(function(response){
        applyReplies(response);
      }, function(errorMessage){
        $scope.repliesError = errorMessage;
      });
    };

    function applyTopByReplies(topByReplies){
      $scope.topByReplies = topByReplies;
    }

    function applyTopBySubmissions(topBySubmissions){
      $scope.topBySubmissions = topBySubmissions;
    }

    function applyTopByFollowers(topByFollowers){
      $scope.topByFollowers = topByFollowers;
    }

    $scope.findProlific = function() {
      Profiles.findTopByReplies()
      .then(function(topByReplies) {
        applyTopByReplies(topByReplies);
      });

      Profiles.findTopBySubmissions()
      .then(function(topBySubmissions) {
        applyTopBySubmissions(topBySubmissions);
      });

      Follow.mostFollowers()
      .then(function(topByFollowers) {
        applyTopByFollowers(topByFollowers);
      });
    };

    $scope.follow = function(userId) {
      Follow.followUser(userId)
      .then(function(user){
        // on success
        $scope.isFollowed = true;        
      }, function(errorMessage){
        $scope.error = errorMessage;
      });
    };

    $scope.unfollow = function(userId) {
      Follow.unfollowUser(userId)
      .then(function(user){
        // on success
        $scope.isFollowed = false;        
      }, function(errorMessage){
        $scope.error = errorMessage;
      });
    };


  }
]);
