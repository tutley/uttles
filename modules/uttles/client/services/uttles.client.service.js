'use strict';
var PAGINATION_TOTAL = 'pagination-total-elements';
var PAGINATION_SIZE = 'pagination-size';

//Uttles service used for communicating with the uttles REST endpoints
angular.module('uttles').factory('Uttles', ['$resource',
  function ($resource) {
    return $resource('api/uttles/:uttleId', {
      uttleId: '@_id'
    }, {
      get: { method:'GET', cache: false },
      update: 
      {
        method: 'PUT'
      },
      query : 
      {
        method: 'GET', 
        cache: false,
        isArray:true, 
        transformResponse : function(data, headers) {
          var jsonData = JSON.parse(data);
          headers()[PAGINATION_TOTAL] = jsonData.totalUttles;
          headers()[PAGINATION_SIZE] = jsonData.perPage;
          return jsonData.content;
        }
      }
    });
  }
]);