'use strict';

// Configuring the Chat module
angular.module('chat').run(['Menus',
  function (Menus) {
    // Set top bar menu items
    // Hide the chat app for now
    // Menus.addMenuItem('topbar', {
    //   title: 'Chat',
    //   state: 'chat'
    // });
  }
]);
