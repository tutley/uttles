'use strict';

angular.module('users').controller('FollowController', ['$scope', '$http', '$location', 'Follow', 'Authentication',
  function ($scope, $http, $location, Follow, Authentication) {
    $scope.user = Authentication.user;

    function applyFollowers(followers){
      $scope.followers = followers;
    }

    function applyFollowing(following){
      $scope.following = following;
    }


    $scope.findFollows = function() {
      Follow.getFollowers()
      .then(function(followers) {
        applyFollowers(followers);
      });

      Follow.getFollowing()
      .then(function(following) {
        applyFollowing(following);
      });
    };


  }]);
