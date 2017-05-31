'use strict';

angular.module('users').factory('Follow', ['$http', '$q',
  function ($http, $q) {
    return({
      followUser: followUser,
      unfollowUser: unfollowUser,
      getFollowers: getFollowers,
      getFollowing: getFollowing,
      mostFollowers: mostFollowers
    });

    function followUser (userId) {
      var request = $http({
        url: '/api/user/follow/' + userId,
        method: 'PUT'
      });
      return(request.then(handleSuccess, handleError));
    }

    function unfollowUser (userId) {
      var request = $http({
        url: '/api/user/unfollow/' + userId,
        method: 'PUT'
      });
      return(request.then(handleSuccess, handleError));
    }   

    function getFollowers() {
      var request = $http({ 
        url: '/api/user/followers', 
        method: 'GET' 
      });
      return(request.then(handleSuccess, handleError));  
    }

    function getFollowing() {
      var request = $http({ 
        url: '/api/user/following', 
        method: 'GET' 
      });
      return(request.then(handleSuccess, handleError));        
    }

    function mostFollowers() {
      var request = $http({ 
        url: '/api/user/top/followers', 
        method: 'GET' 
      });
      return(request.then(handleSuccess, handleError));      
    } 

    function handleError(response) {
      if (
        ! angular.isObject(response.data) ||
        ! response.data.message
        ) {
        return($q.reject('An unknown error occurred.'));
      }
      return($q.reject(response.data.message));
    }

    function handleSuccess(response) {
      return(response.data);
    }

  }
]);