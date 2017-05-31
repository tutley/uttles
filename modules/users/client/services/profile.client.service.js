'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Profiles', ['$http', '$q',
  function ($http, $q) {
    return({
      findByUsername: findByUsername,
      userReplies: userReplies,
      findTopByReplies: findTopByReplies,
      findTopBySubmissions: findTopBySubmissions
    });

    function findByUsername (username) {
      var request = $http({
        url: '/api/user/profile/' + username,
        method: 'GET'
      });
      return(request.then(handleSuccess, handleError));
    }

    function userReplies (pageTo, perPage, userId) {
      var page = pageTo || 1;

      var request = $http({
        url: '/api/user/replies/' + userId,
        method: 'GET',
        params: { perPage: perPage, page: page }
      });
      return(request.then(handleSuccess, handleError));
    }

    function findTopByReplies() {
      var request = $http({ 
        url: '/api/user/top/replies', 
        method: 'GET' 
      });
      return(request.then(handleSuccess, handleError));
    }

    function findTopBySubmissions() {
      var request = $http({ 
        url: '/api/user/top/submissions', 
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