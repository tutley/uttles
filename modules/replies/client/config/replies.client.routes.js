'use strict';

// Setting up route
angular.module('replies').config(['$stateProvider',
  function ($stateProvider) {
    // Replies state routing
    // It may seem confusing, but a top level reply is called a "uttle" in our system, so the route is uttle
    // however we may want to one day display lower level replies individually, so the name reply sticks
    $stateProvider
      .state('replies', {
        abstract: true,
        url: '/uttle',
        template: '<ui-view/>'
      })
      .state('replies.view', {
        url: '/:replyId?scrollTo',
        templateUrl: 'modules/replies/client/views/view-reply.client.view.html'
      });
  }
]);
