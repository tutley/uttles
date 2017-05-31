'use strict';

angular.module('users').controller('NotificationsController', ['$scope', '$http', '$location', 'Authentication',
  function ($scope, $http, $location, Authentication) {
    $scope.user = Authentication.user;
    $scope.error = null;

    $scope.find = function() {
      // find a list of notifications along with their statuses
      $http({
        url: '/api/user/notifications/',
        method: 'GET'
      }).then(function (result) {
        $scope.notifications = result.data;
      }, function(error) {
        $scope.error = error.message;
      });
    };

    $scope.markRead = function(notification) {
      // mark a particular notification as read
      if (!notification.read) {
        $http({
          url: '/api/user/notification/' + notification._id,
          method: 'PUT'
        }).then(function (result) {
          // remove the notification from the user object (and the browser window)
          var nIndex = -1;
          for(var i = 0, len = Authentication.user.notifications.length; i < len; i++) {
            if (Authentication.user.notifications[i]._id === notification._id) {
              nIndex = i;
              break;
            }
          }
          if (nIndex > -1) {
            Authentication.user.notifications.splice(nIndex, 1);
          }
          notification.read = true;
        }, function(error) {
          $scope.error = error.message;
        });            
      }
    };

    $scope.archive = function(notification) {
      // mark a particular notification as archived
      $http({
        url: '/api/user/notification/' + notification._id,
        method: 'DELETE'
      }).then(function (result) {
        console.log(result);
        // remove the notification from the user object (and the browser window)
        var nIndex = -1;
        for(var i = 0, len = Authentication.user.notifications.length; i < len; i++) {
          if (Authentication.user.notifications[i]._id === notification._id) {
            nIndex = i;
            break;
          }
        }
        if (nIndex > -1) {
          Authentication.user.notifications.splice(nIndex, 1);
        }
        notification.read = true;

        // now remove the notification from the list of notifications in the view
        var nIndex2 = $scope.notifications.indexOf(notification);
        console.log('index found: ' + nIndex2);
        $scope.notifications.splice(nIndex2, 1);
      }, function(error) {
        $scope.error = error.message;
      });     
    };

  }]);