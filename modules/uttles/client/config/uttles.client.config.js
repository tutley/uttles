'use strict';

angular.module('uttles').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Create',
      state: 'uttles.start',
      roles: ['*']
    });
  }
]);