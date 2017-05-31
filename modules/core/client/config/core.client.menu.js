'use strict';

angular.module('core').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'About',
      state: 'about',
      roles: ['*']
    });
  }
]);
