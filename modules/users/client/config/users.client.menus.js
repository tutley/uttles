'use strict';

angular.module('users').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Prolific',
      state: 'prolific',
      roles: ['*']
    });
  }
]);
