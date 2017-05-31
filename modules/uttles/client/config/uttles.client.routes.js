'use strict';
// TODO: change alltime back to false when ready to limit number of uttles shown
// Setting up route
angular.module('uttles').config(['$stateProvider',
  function ($stateProvider) {
    // Uttles state routing
    $stateProvider
      .state('uttles', {
        abstract: true,
        url: '/',
        template: '<ui-view/>'
      })
      .state('uttles.list', {
        url: '?page&perPage&sort&alltime&everyone&tag&q',
        templateUrl: 'modules/uttles/client/views/list-uttles.client.view.html',
        params : {
          page: {
            value: '1',
            squash: 'true'
          },
          perPage: {
            value: '10',
            squash: 'true'
          },
          sort: {
            value: 'submissions',
            squash: 'true'
          },
          alltime: {
            value: '1',
            squash: 'true'
          },
          everyone: {
            value: '1',
            squash: 'true'
          }
        }
      })
      .state('uttles.tag', {
        url: 'tag/:tag?page&perPage&sort&everyone&alltime&q',
        templateUrl: 'modules/uttles/client/views/list-uttles.client.view.html',
        params : {
          page: {
            value: '1',
            squash: 'true'
          },
          perPage: {
            value: '10',
            squash: 'true'
          },
          sort: {
            value: 'submissions',
            squash: 'true'
          },
          alltime: {
            value: '1',
            squash: 'true'
          },
          everyone: {
            value: '1',
            squash: 'true'
          }
        }
      })      
      .state('uttles.start', {
        url: 'create?url',
        templateUrl: 'modules/uttles/client/views/start-uttle.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('uttles.create', {
        url: 'create/:uttleId',
        templateUrl: 'modules/uttles/client/views/create-uttle.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('uttles.view', {
        url: ':uttleId?scrollTo',
        views: {
          '@' : {
            templateUrl: 'modules/uttles/client/views/view-uttle.client.view.html'            
          },
          'replies@uttles.view' : {
            templateUrl: 'modules/replies/client/views/list-replies.client.view.html',
            controller: 'RepliesController'          
          }
        }
      })
      .state('uttles.edit', {
        url: ':uttleId/edit',
        templateUrl: 'modules/uttles/client/views/edit-uttle.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);



