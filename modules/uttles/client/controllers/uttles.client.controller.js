'use strict';
var PAGINATION_TOTAL = 'pagination-total-elements';
var PAGINATION_SIZE = 'pagination-size';

// Uttles controller
angular.module('uttles').controller('UttlesController', ['$scope', '$state', '$stateParams', '$location', 'Authentication', 'Uttles', 'Replies', '$sce',
  function ($scope, $state, $stateParams, $location, Authentication, Uttles, Replies, $sce) {
    $scope.authentication = Authentication;
    $scope.newUttle = {};
    //$scope.uttleExisted = ($stateParams.u === 'true');
    $scope.previewIsCollapsed = true; // don't show the preview html by default
    $scope.alltime = $stateParams.alltime;
    $scope.sort = $stateParams.sort;
    $scope.userHasUttle = false;
    $scope.error = null;
    $scope.url = $stateParams.url;
    $scope.everyone = $stateParams.everyone;

    // Populate the preview data then un-hide it
    $scope.previewToggle = function(previewCurrentlyCollapsed) {
      // it was collapsed, now uncollapse it
      if (previewCurrentlyCollapsed) {
        $scope.previewHtml = $sce.trustAsHtml($scope.uttle.contentHtml);
        $scope.previewIsCollapsed = false;
      } else {
        $scope.previewHtml = '';
        $scope.previewIsCollapsed = true;
      }
    };

    // Start the Uttle Creation
    // It is a two step process. Step 1 creates a new uttle on the server
    // Step two is called create, but it's actually an update of a fresh uttle
    // Step 3 is where we actually create the "uttle" (top level reply) and attach
    // it to the uttle object. This helper function is the first thing we'll define
    // but it is used last
    function createTopLevelReply(uttle, content){
      // use the Replies service to create a new top level reply and attach it to 
      // this new uttle
      var reply = new Replies({
        content: content,
        uttle: uttle._id,
        nestedLevel: 1
      });

      // Use resource to hit the server api, then go to the uttle display page
      reply.$save(function (response) {
        $location.path('/uttle/'+ response._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    }

    $scope.start = function (isValid) {
      $scope.error = null;
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'uttleForm');
        return false;
      }

      var endOfUrl = this.url.length;
      var qPos = this.url.indexOf('?utm_');
      var pPos = this.url.indexOf('#');
      // can't just search for ? or it breaks youtube
      if (qPos > -1) {
        endOfUrl = qPos;
      }
      if (pPos > -1) {
        if (pPos < endOfUrl) {
          endOfUrl = pPos;
        }
      }

      var finalUrl = this.url.substr(0, endOfUrl);
      var uttle = new Uttles({
        url: finalUrl
      });

      // Redirect after save
      uttle.$save(function (response) {
        $scope.uttle = response.uttle;
        // not really using this for anything, might take it out of server controller
        // (the answer to wether the uttle existed or not)
        var didExist = {
          'u' : response.existed
        };
        $location.path('/create/' + response.uttle._id);
        // Clear form fields
        $scope.url = '';
      }, function (errorResponse) {
        if (errorResponse.status === 404) {
          $scope.error = 'We were not able to process that link. This is really odd, so please report this problem.';
        } else {
          $scope.error = errorResponse.data.message;
        }
      });
    };
    // Step 2 of uttle creation 
    // Update existing Uttle if need be
    // Also fire off step 3, the uttle (top level reply) creation
    $scope.create = function () {
      $scope.createErrors = {};
      var newUttle = $scope.newUttle;
      // Now populate the changes
      var uttle = $scope.uttle;
      if (!uttle.title) {
        uttle.title = newUttle.title;
      }
      if (!uttle.summary) {
        uttle.summary = newUttle.summary;
      }
      uttle.tags = newUttle.tags;
      var content = newUttle.content;
      // went with manual validation this time because this is kindof a whacky process
      if (!uttle.title && !newUttle.title) {
        $scope.createErrors.title = true;
        return false;
      }
      if (!uttle.summary && !newUttle.summary) {
        $scope.createErrors.summary = true;
        return false;
      }
      var totalTags = 0;
      if (uttle.tags) {
        totalTags = uttle.tags.length;
      }
      if (totalTags>12) {
        $scope.createErrors.tags = true;
        return false;
      }
      if (!content) {
        $scope.createErrors.content = true;
        return false;
      }

      // Check to see if we actually need to hit the api
      if (angular.equals({}, newUttle) && uttle.summary && uttle.title) {
        // the uttle was complete and they added no tags, so just
        // submit the uttle (top level reply)
        createTopLevelReply(uttle, content);
        return;
      }

      uttle.$update(function () {
        $scope.newUttle = {};
        createTopLevelReply(uttle, content);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };


    // Remove existing Uttle
    $scope.remove = function (uttle) {
      if (uttle) {
        uttle.$remove();

        for (var i in $scope.uttles) {
          if ($scope.uttles[i] === uttle) {
            $scope.uttles.splice(i, 1);
          }
        }
      } else {
        $scope.uttle.$remove(function () {
          $location.path('');
        });
      }
    };

    // Update existing Uttle
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'uttleForm');

        return false;
      }

      var uttle = $scope.uttle;
      uttle.tags = $scope.tags;

      uttle.$update(function () {
        $scope.tags = {};
        $location.path('/' + uttle._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Uttles
    $scope.find = function () {
      var qObject = {};
      if ($stateParams.tag) {
        qObject.tag = $stateParams.tag;
      } 
      qObject.page = $stateParams.page;
      qObject.perPage = $stateParams.perPage;
      qObject.alltime = $stateParams.alltime;
      qObject.everyone = $stateParams.everyone;
      qObject.sort = $stateParams.sort;

      if ($stateParams.q) {
        qObject.search = $stateParams.q;
      } 

      Uttles.query(qObject, function(result, headers){
        $scope.uttles = result;
        $scope.totalUttles = headers(PAGINATION_TOTAL);
        $scope.perPage = headers(PAGINATION_SIZE);
        $scope.currentPage = $stateParams.page;
      });
    };

    // Pagination stuff
    // Pagination depends on the scope variables totalUttles and perPage
    $scope.pageChanged = function(pageTo) {
      var newParams = angular.extend({}, $stateParams, { 'page' : pageTo });
      // console.log(JSON.stringify(newParams, null, 0));
      $state.go('uttles.list', newParams);
    };

    $scope.relist = function(thisParam) {
      var newParams = angular.extend({}, $stateParams, thisParam);
      $scope.page = 1;
      $state.go('uttles.list', newParams);
    };

    // Find existing Uttle
    $scope.findOne = function () {
      Uttles.get({ uttleId: $stateParams.uttleId }, function(result){
        $scope.uttle = result;
        $scope.userHasUttle = (result.submitters.indexOf(Authentication.user._id)>-1);
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
