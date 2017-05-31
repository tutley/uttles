'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function () {
  // Init module configuration options
  var applicationModuleName = 'mean';
  var applicationModuleVendorDependencies = ['ngResource', 'angularMoment', 'updateMeta', 'ngSanitize', 'ngAnimate', 'ngMessages', 'ui.router', 'ui.bootstrap', 'ui.utils', 'angularFileUpload'];

  // Add a new vertical module
  var registerModule = function (moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  };

  return {
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: applicationModuleVendorDependencies,
    registerModule: registerModule
  };
})();

'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider', '$httpProvider',
  function ($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');

    $httpProvider.interceptors.push('authInterceptor');
  }
]);

angular.module(ApplicationConfiguration.applicationModuleName).run(["$rootScope", "$state", "Authentication", function ($rootScope, $state, Authentication) {

  // Check authentication before changing state
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (toState.data && toState.data.roles && toState.data.roles.length > 0) {
      var allowed = false;
      toState.data.roles.forEach(function (role) {
        if (Authentication.user.roles !== undefined && Authentication.user.roles.indexOf(role) !== -1) {
          allowed = true;
          return true;
        }
      });

      if (!allowed) {
        event.preventDefault();
        if (Authentication.user !== undefined && typeof Authentication.user === 'object') {
          $state.go('forbidden');
        } else {
          $state.go('authentication.signin').then(function () {
            storePreviousState(toState, toParams);
          });
        }
      }
    }
  });

  // Record previous state
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    storePreviousState(fromState, fromParams);
  });

  // Store previous state
  function storePreviousState(state, params) {
    // only store this state if it shouldn't be ignored 
    if (!state.data || !state.data.ignoreState) {
      $state.previous = {
        state: state,
        params: params,
        href: $state.href(state, params)
      };
    }
  }
}]);

//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Fixing facebook bug with redirect
  if (window.location.hash && window.location.hash === '#_=_') {
    if (window.history && history.pushState) {
      window.history.pushState('', document.title, window.location.pathname);
    } else {
      // Prevent scrolling by storing the page's current scroll offset
      var scroll = {
        top: document.body.scrollTop,
        left: document.body.scrollLeft
      };
      window.location.hash = '';
      // Restore the scroll offset, should be flicker free
      document.body.scrollTop = scroll.top;
      document.body.scrollLeft = scroll.left;
    }
  }

  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('chat');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
ApplicationConfiguration.registerModule('core.admin', ['core']);
ApplicationConfiguration.registerModule('core.admin.routes', ['ui.router']);

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('replies');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users', ['core']);
ApplicationConfiguration.registerModule('users.admin', ['core.admin']);
ApplicationConfiguration.registerModule('users.admin.routes', ['core.admin.routes']);

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('uttles');

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

'use strict';

// Configure the 'chat' module routes
angular.module('chat').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('chat', {
        url: '/chat',
        templateUrl: 'modules/chat/client/views/chat.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);

'use strict';

// Create the 'chat' controller
angular.module('chat').controller('ChatController', ['$scope', '$location', 'Authentication', 'Socket',
  function ($scope, $location, Authentication, Socket) {
    // Create a messages array
    $scope.messages = [];

    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Add an event listener to the 'chatMessage' event
    Socket.on('chatMessage', function (message) {
      $scope.messages.unshift(message);
    });

    // Create a controller method for sending messages
    $scope.sendMessage = function () {
      // Create a new message object
      var message = {
        text: this.messageText
      };

      // Emit a 'chatMessage' message event
      Socket.emit('chatMessage', message);

      // Clear the message text
      this.messageText = '';
    };

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('chatMessage');
    });
  }
]);

'use strict';

angular.module('core.admin').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Admin',
      state: 'admin',
      type: 'dropdown',
      roles: ['admin']
    });
  }
]);

'use strict';

// Setting up route
angular.module('core.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin', {
        abstract: true,
        url: '/admin',
        template: '<ui-view/>',
        data: {
          roles: ['admin']
        }
      });
  }
]);

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

'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    // Home state routing
    $stateProvider
    .state('home', {
      url: '/oldhome',
      templateUrl: 'modules/core/client/views/home.client.view.html'
    })
    .state('about', {
      url: '/about',
      templateUrl: 'modules/core/client/views/about.client.view.html'
    })
    .state('not-found', {
      url: '/not-found',
      templateUrl: 'modules/core/client/views/404.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('bad-request', {
      url: '/bad-request',
      templateUrl: 'modules/core/client/views/400.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'modules/core/client/views/403.client.view.html',
      data: {
        ignoreState: true
      }
    });
  }
]);

'use strict';

angular.module('core').controller('AboutController', ['$scope', 'Authentication',
  function ($scope, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
  }
]);

'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$state', 'Authentication', 'Menus',
  function ($scope, $state, Authentication, Menus) {
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
  }
]);

'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication',
  function ($scope, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
  }
]);

'use strict';

angular.module('core')
.directive('autofocus', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    link : function($scope, $element) {
      $timeout(function() {
        $element[0].focus();
      });
    }
  };
}]);
'use strict';

angular.module('core')
  .directive('shareLinks', ['$location', function ($location) {
    return {
      link: function (scope, elem, attrs) {
        var i,
          sites = ['twitter', 'facebook', 'linkedin', 'google-plus'],
          theLink,
          links = attrs.shareLinks.toLowerCase().split(','),
          pageLink = encodeURIComponent($location.absUrl().replace(/uttle\//i, 'perma/')),
          pageTitle = attrs.shareTitle,
          pageTitleUri = encodeURIComponent(pageTitle),
          shareLinks = [],
          square = '';

        elem.addClass('td-easy-social-share');

        // check if square icon specified
        square = (attrs.shareSquare && attrs.shareSquare.toString() === 'true') ? '-square' : '';

        // assign share link for each network
        angular.forEach(links, function (key) {
          key = key.trim();

          switch (key) {
            case 'twitter':
              theLink = 'http://twitter.com/intent/tweet?text=' + pageTitleUri + '%20' + pageLink;
              break;
            case 'facebook':
              theLink = 'http://facebook.com/sharer.php?u=' + pageLink;
              break;
            case 'linkedin':
              theLink = 'http://www.linkedin.com/shareArticle?mini=true&url=' + pageLink + '&title=' + pageTitleUri;
              break;
            case 'google-plus':
              theLink = 'https://plus.google.com/share?url=' + pageLink;
              break;
          }

          if (sites.indexOf(key) > -1) {
            shareLinks.push({ network: key, url: theLink });
          }
        });

        for (i = 0; i < shareLinks.length; i++) {
          var anchor = '';
          anchor += '<a href="'+ shareLinks[i].url + '"';
          anchor += ' class="fa fa-'+shareLinks[i].network + square + '" target="_blank"';
          anchor += '></a>';
          elem.append(anchor);
        }
      }
    };
  }]);
'use strict';

/**
 * Edits by Ryan Hutchison
 * Credit: https://github.com/paulyoder/angular-bootstrap-show-errors */

angular.module('core')
  .directive('showErrors', ['$timeout', '$interpolate', function ($timeout, $interpolate) {
    var linkFn = function (scope, el, attrs, formCtrl) {
      var inputEl, inputName, inputNgEl, options, showSuccess, toggleClasses,
        initCheck = false,
        showValidationMessages = false,
        blurred = false;

      options = scope.$eval(attrs.showErrors) || {};
      showSuccess = options.showSuccess || false;
      inputEl = el[0].querySelector('.form-control[name]') || el[0].querySelector('[name]');
      inputNgEl = angular.element(inputEl);
      inputName = $interpolate(inputNgEl.attr('name') || '')(scope);

      if (!inputName) {
        throw 'show-errors element has no child input elements with a \'name\' attribute class';
      }

      var reset = function () {
        return $timeout(function () {
          el.removeClass('has-error');
          el.removeClass('has-success');
          showValidationMessages = false;
        }, 0, false);
      };

      scope.$watch(function () {
        return formCtrl[inputName] && formCtrl[inputName].$invalid;
      }, function (invalid) {
        return toggleClasses(invalid);
      });

      scope.$on('show-errors-check-validity', function (event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          initCheck = true;
          showValidationMessages = true;

          return toggleClasses(formCtrl[inputName].$invalid);
        }
      });

      scope.$on('show-errors-reset', function (event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          return reset();
        }
      });

      toggleClasses = function (invalid) {
        el.toggleClass('has-error', showValidationMessages && invalid);
        if (showSuccess) {
          return el.toggleClass('has-success', showValidationMessages && !invalid);
        }
      };
    };

    return {
      restrict: 'A',
      require: '^form',
      compile: function (elem, attrs) {
        if (attrs.showErrors.indexOf('skipFormGroupCheck') === -1) {
          if (!(elem.hasClass('form-group') || elem.hasClass('input-group'))) {
            throw 'show-errors element does not have the \'form-group\' or \'input-group\' class';
          }
        }
        return linkFn;
      }
    };
  }]);

'use strict';

angular.module('core').factory('authInterceptor', ['$q', '$injector',
  function ($q, $injector) {
    return {
      responseError: function(rejection) {
        if (!rejection.config.ignoreAuthModule) {
          switch (rejection.status) {
            case 401:
              $injector.get('$state').transitionTo('authentication.signin');
              break;
            case 403:
              $injector.get('$state').transitionTo('forbidden');
              break;
          }
        }
        // otherwise, default behaviour
        return $q.reject(rejection);
      }
    };
  }
]);

'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [
  function () {
    // Define a set of default roles
    this.defaultRoles = ['user', 'admin'];

    // Define the menus object
    this.menus = {};

    // A private function for rendering decision
    var shouldRender = function (user) {
      if (!!~this.roles.indexOf('*')) {
        return true;
      } else {
        if(!user) {
          return false;
        }
        for (var userRoleIndex in user.roles) {
          for (var roleIndex in this.roles) {
            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
              return true;
            }
          }
        }
      }

      return false;
    };

    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exist');
        }
      } else {
        throw new Error('MenuId was not provided');
      }

      return false;
    };

    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      return this.menus[menuId];
    };

    // Add new menu object by menu id
    this.addMenu = function (menuId, options) {
      options = options || {};

      // Create the new menu
      this.menus[menuId] = {
        roles: options.roles || this.defaultRoles,
        items: options.items || [],
        shouldRender: shouldRender
      };

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      delete this.menus[menuId];
    };

    // Add menu item object
    this.addMenuItem = function (menuId, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Push new menu item
      this.menus[menuId].items.push({
        title: options.title || '',
        state: options.state || '',
        type: options.type || 'item',
        class: options.class,
        roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.defaultRoles : options.roles),
        position: options.position || 0,
        items: [],
        shouldRender: shouldRender
      });

      // Add submenu items
      if (options.items) {
        for (var i in options.items) {
          this.addSubMenuItem(menuId, options.state, options.items[i]);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Add submenu item object
    this.addSubMenuItem = function (menuId, parentItemState, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === parentItemState) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: options.title || '',
            state: options.state || '',
            roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : options.roles),
            position: options.position || 0,
            shouldRender: shouldRender
          });
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === menuItemState) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].state === submenuItemState) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    //Adding the topbar menu
    this.addMenu('topbar', {
      roles: ['*']
    });
  }
]);

'use strict';

// Create the Socket.io wrapper service
angular.module('core').service('Socket', ['Authentication', '$state', '$timeout',
  function (Authentication, $state, $timeout) {
    // Connect to Socket.io server
    this.connect = function () {
      // Connect only when authenticated
      if (Authentication.user) {
        this.socket = io();
      }
    };
    this.connect();

    // Wrap the Socket.io 'on' method
    this.on = function (eventName, callback) {
      if (this.socket) {
        this.socket.on(eventName, function (data) {
          $timeout(function () {
            callback(data);
          });
        });
      }
    };

    // Wrap the Socket.io 'emit' method
    this.emit = function (eventName, data) {
      if (this.socket) {
        this.socket.emit(eventName, data);
      }
    };

    // Wrap the Socket.io 'removeListener' method
    this.removeListener = function (eventName) {
      if (this.socket) {
        this.socket.removeListener(eventName);
      }
    };
  }
]);

'use strict';

// Configuring the Replies module
angular.module('replies').run(['Menus',
  function (Menus) {
    // // Add the replies dropdown item
    // Menus.addMenuItem('topbar', {
    //   title: 'Replies',
    //   state: 'replies',
    //   type: 'dropdown',
    //   roles: ['*']
    // });

    // // Add the dropdown list item
    // Menus.addSubMenuItem('topbar', 'replies', {
    //   title: 'List Replies',
    //   state: 'replies.list'
    // });

    // // Add the dropdown create item
    // Menus.addSubMenuItem('topbar', 'replies', {
    //   title: 'Create Replies',
    //   state: 'replies.create',
    //   roles: ['user']
    // });
  }
]);

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

'use strict';

// Replies controller
angular.module('replies')
.run(['$anchorScroll', function($anchorScroll) {
  $anchorScroll.yOffset = 50;   // always scroll by 50 extra pixels
}])
.controller('RepliesController', ['$scope', '$stateParams', '$anchorScroll', '$location', 'Authentication', 'Replies', 'RecursionHelper', 
  function ($scope, $stateParams, $anchorScroll, $location, Authentication, Replies, RecursionHelper) {
    $scope.authentication = Authentication;
    // Init the new top level reply Form
    $scope.topReply = {};
    $scope.topReplyCollapsed = true;
    $scope.topReplyAvailable = (Authentication.user);
    $scope.previewIsCollapsed = true; // don't show the preview html by default
    $scope.everyone = true; //show all replies by default
    var scrollTo = $stateParams.scrollTo;
    $scope.replies = [];

    // function scrollToReply() {
    //   if ($stateParams.scrollTo) {
    //     var newHash = 'reply' + scrollTo;
    //     console.log(newHash);
    //     $location.hash(newHash);
    //     $anchorScroll();
    //     $location.hash(null);
    //   }
    // }

    $scope.$watch('replies', function(newValue, oldValue) {
      if (newValue.$resolved) {
        var newHash = 'reply' + scrollTo;
        $location.hash(newHash);
        $anchorScroll();
        $location.hash(null);
      }
    });

    // There is probably a better way to do this. I'm using these helper functions
    // in conjunction with the ui.bootsrap "collapse" tag to show/hide things
    $scope.showReplyForm = function(replyId) {
      if (!Authentication.user) {
        $location.path('/authentication/signin');
      }
      $scope.currentReplyId = replyId;  
    };
    $scope.cancelReply = function() {
      $scope.currentReplyId = null;
    };

    $scope.prepareDelete = function(replyId) {
      $scope.replyToDelete = replyId;  
    };
    $scope.cancelDelete = function() {
      $scope.replyToDelete = null;
    };

    $scope.prepareEdit = function(reply) {
      reply.newContent = reply.content;
      $scope.replyToEdit = reply._id;  
    };
    $scope.cancelEdit = function() {
      $scope.replyToEdit = null;
    };

    // show all replies
    $scope.showAll = function() {
      $scope.everyone = true;
    };
    
    // show only replies of people you follow
    $scope.showFollowing = function() {
      $scope.everyone = false;
    };


    // $scope.prepareReport = function(replyId) {
    //   $scope.replyToReport = replyId;  
    // };
    // End show/hide stuff

    // CRUD Operations
    // Create new Reply where replyId is the _id of the reply we're replying to
    $scope.create = function (currentReply) {
      currentReply.error = null;
      // First make sure there's actually something in the reply
      // TODO: provide an error or feedback somehow
      if (!currentReply.newReply) {
        currentReply.error = 'The reply was empty!';
        return false;
      }
      // Now check that they haven't somehow replied to a level 9 reply
      var newReplyLevel = currentReply.nestedLevel + 1;
      if (newReplyLevel > 9) {
        currentReply.error = 'how the hell did you do that?';
        return false;
      }

      // Construct a new reply to send to the api
      var reply = new Replies({
        content: currentReply.newReply,
        uttle: currentReply.uttle,
        replyTo: currentReply._id,
        nestedLevel: newReplyLevel
      });

      // Use resource to hit the server api, then push the reply into the current view
      reply.$save(function (response) {
        currentReply.replies.unshift(response); 
        currentReply.newReply='';
        $scope.currentReplyId = null;
      }, function (errorResponse) {
        currentReply.error = errorResponse.data.message;
      });
    };

    // Remove existing Reply
    $scope.remove = function (reply) {
      if (reply) {
        var deadManWalking = new Replies(reply);
        deadManWalking.$remove({},
          //success
          function(value){
            // brute force method of removing the reply from view
            // $scope.find();

            // TODO: find a way to remove this one directive rather than just collapsing it
            reply.isDeleted = true;
          },
          //error
          function(error){
            reply.error = error.data.message;
          }
        );
      }
    };

    // Update existing Reply
    $scope.update = function (currentReply) {
      currentReply.error = null;

      if (!currentReply.newContent) {
        currentReply.error = 'The reply was empty!';
        return false;
      }
      if (currentReply.newContent === currentReply.content) {
        currentReply.error = 'You did not change anything!';
        return false;
      }

      var reply = new Replies(currentReply);
      reply.content = currentReply.newContent;

      reply.$update(function (response) {
        currentReply.content = response.content;
        currentReply.edited = response.edited;
        $scope.replyToEdit = null;
      }, function (errorResponse) {
        currentReply.error = errorResponse.data.message;
      });
    };

    // Find a list of Replies
    $scope.find = function () {
      var uttleId = $stateParams.uttleId;
      $scope.showAll();
      Replies.query({ 'uttle' : uttleId }, function(response) {  
        $scope.replies = response;
        // Init Toggles 
        // TODO: do this reply toggle init better
        $scope.isCollapsed = {};
        //scrollToReply();
        angular.forEach($scope.replies, function(reply){
          $scope.isCollapsed[reply._id] = false;
          angular.forEach(reply.replies, function(reply){
            $scope.isCollapsed[reply._id] = false;
            angular.forEach(reply.replies, function(reply){
              $scope.isCollapsed[reply._id] = false;
              angular.forEach(reply.replies, function(reply){
                $scope.isCollapsed[reply._id] = false;
                angular.forEach(reply.replies, function(reply){
                  $scope.isCollapsed[reply._id] = false;
                  angular.forEach(reply.replies, function(reply){
                    $scope.isCollapsed[reply._id] = false;
                    angular.forEach(reply.replies, function(reply){
                      $scope.isCollapsed[reply._id] = false;
                      angular.forEach(reply.replies, function(reply){
                        $scope.isCollapsed[reply._id] = false;
                        angular.forEach(reply.replies, function(reply){
                          $scope.isCollapsed[reply._id] = false;
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });    
    };

    // Find existing Reply
    $scope.findOne = function () {
      $scope.showAll();
      Replies.get({
        replyId: $stateParams.replyId
      }, function(reply) {
        $scope.isCollapsed = {};
        $scope.reply = reply;
        // check the list of submitters to see if this user already made a uttle about this
        if (reply.uttle.submitters.indexOf(Authentication.user._id) > -1) {
          $scope.topReplyAvailable = false;
        }
        //scrollToReply();
        angular.forEach(reply.replies, function(reply){
          $scope.isCollapsed[reply._id] = false;
          angular.forEach(reply.replies, function(reply){
            $scope.isCollapsed[reply._id] = false;
            angular.forEach(reply.replies, function(reply){
              $scope.isCollapsed[reply._id] = false;
              angular.forEach(reply.replies, function(reply){
                $scope.isCollapsed[reply._id] = false;
                angular.forEach(reply.replies, function(reply){
                  $scope.isCollapsed[reply._id] = false;
                  angular.forEach(reply.replies, function(reply){
                    $scope.isCollapsed[reply._id] = false;
                    angular.forEach(reply.replies, function(reply){
                      $scope.isCollapsed[reply._id] = false;
                      angular.forEach(reply.replies, function(reply){
                        $scope.isCollapsed[reply._id] = false;
                      });
                    });
                  });
                });
              });
            });
          });
        });
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


'use strict';

angular.module('replies')
  .directive('showReplies', ['RecursionHelper', 
    function (RecursionHelper) {
      return {
        restrict: 'E',
        scope: false,
        templateUrl: '/modules/replies/client/views/show-replies.client.view.html',
        compile: function(element) {
          return RecursionHelper.compile(element);
        }
      };
    }]);
'use strict';
/* 
 * An Angular service which helps with creating recursive directives.
 * @author Mark Lagendijk
 * @license MIT
 */
angular.module('replies').factory('RecursionHelper', ['$compile', function($compile){
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param element
     * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
     * @returns An object containing the linking functions.
     */
    compile: function(element, link){
      // Normalize the link parameter
      if(angular.isFunction(link)){
        link = { post: link };
      }

      // Break the recursion loop by removing the contents
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        /**
         * Compiles and re-adds the contents
         */
        post: function(scope, element){
          // Compile the contents
          if(!compiledContents){
            compiledContents = $compile(contents);
          }
          // Re-add the compiled contents to the element
          compiledContents(scope, function(clone){
            element.append(clone);
          });

          // Call the post-linking function, if any
          if(link && link.post){
            link.post.apply(null, arguments);
          }
        }
      };
    }
  };
}]);
'use strict';

//Replies service used for communicating with the replies REST endpoints
angular.module('replies').factory('Replies', ['$resource',
  function ($resource) {
    return $resource('api/replies/:replyId', {
      replyId: '@_id'
    }, {
      get: { method:'GET', cache: false },
      query: { method:'GET', cache: false, isArray:true },
      update: {
        method: 'PUT'
      }
    });
  }
]);

'use strict';

// Configuring the Articles module
angular.module('users.admin').run(['Menus',
  function (Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Users',
      state: 'admin.users'
    });
  }
]);

'use strict';

// Setting up route
angular.module('users.admin.routes').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('admin.users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController'
      })
      .state('admin.user', {
        url: '/users/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.user-edit', {
        url: '/users/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function ($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      });
  }
]);

'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push(['$q', '$location', 'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError: function (rejection) {
            switch (rejection.status) {
              case 401:
                // Deauthenticate the global user
                Authentication.user = null;

                // Redirect to signin page
                $location.path('signin');
                break;
              case 403:
                // Add unauthorized behaviour
                break;
            }

            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

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

'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider
      .state('settings', {
        abstract: true,
        url: '/settings',
        templateUrl: 'modules/users/client/views/settings/settings.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('settings.follow', {
        url: '/follow',
        templateUrl: 'modules/users/client/views/settings/follow.client.view.html'
      })
      .state('settings.profile', {
        url: '/profile',
        templateUrl: 'modules/users/client/views/settings/edit-profile.client.view.html'
      })
      .state('settings.notifications', {
        url: '/notifications',
        templateUrl: 'modules/users/client/views/settings/notifications.client.view.html'
      })
      .state('settings.password', {
        url: '/password',
        templateUrl: 'modules/users/client/views/settings/change-password.client.view.html'
      })
      .state('settings.accounts', {
        url: '/accounts',
        templateUrl: 'modules/users/client/views/settings/manage-social-accounts.client.view.html'
      })
      .state('settings.picture', {
        url: '/picture',
        templateUrl: 'modules/users/client/views/settings/change-profile-picture.client.view.html'
      })
      .state('authentication', {
        abstract: true,
        url: '/authentication',
        templateUrl: 'modules/users/client/views/authentication/authentication.client.view.html'
      })
      .state('authentication.signup', {
        url: '/signup',
        templateUrl: 'modules/users/client/views/authentication/signup.client.view.html'
      })
      .state('authentication.signin', {
        url: '/signin?err',
        templateUrl: 'modules/users/client/views/authentication/signin.client.view.html'
      })
      .state('password', {
        abstract: true,
        url: '/password',
        template: '<ui-view/>'
      })
      .state('password.forgot', {
        url: '/forgot',
        templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html'
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html'
      })
      .state('password.reset.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html'
      })
      .state('password.reset.form', {
        url: '/:token',
        templateUrl: 'modules/users/client/views/password/reset-password.client.view.html'
      })
      .state('profiles', {
        abstract: true,
        url: '/p',
        template: '<ui-view/>'
      })
      .state('profiles.user', {
        url: '/:username?page&perPage',
        templateUrl: 'modules/users/client/views/profile/view-profile.client.view.html'
      })
      .state('prolific', {
        url: '/prolific',
        templateUrl: 'modules/users/client/views/profile/view-prolific.client.view.html'
      });
  }
]);
// TODO: Make a user profile page
'use strict';

angular.module('users.admin').controller('UserListController', ['$scope', '$filter', 'Admin',
  function ($scope, $filter, Admin) {
    Admin.query(function (data) {
      $scope.users = data;
      $scope.buildPager();
    });

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.users, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };
  }
]);

'use strict';

angular.module('users.admin').controller('UserController', ['$scope', '$state', 'Authentication', 'userResolve',
  function ($scope, $state, Authentication, userResolve) {
    $scope.authentication = Authentication;
    $scope.user = userResolve;

    $scope.remove = function (user) {
      if (confirm('Are you sure you want to delete this user?')) {
        if (user) {
          user.$remove();

          $scope.users.splice($scope.users.indexOf(user), 1);
        } else {
          $scope.user.$remove(function () {
            $state.go('admin.users');
          });
        }
      }
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = $scope.user;

      user.$update(function () {
        $state.go('admin.user', {
          userId: user._id
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator',
  function ($scope, $state, $http, $location, $window, Authentication, PasswordValidator) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    // If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'uttles.list', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    $scope.signin = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'uttles.list', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function (url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);

'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication', 'PasswordValidator',
  function ($scope, $stateParams, $http, $location, Authentication, PasswordValidator) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    //If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    // Submit forgotten password account id
    $scope.askForPasswordReset = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'forgotPasswordForm');

        return false;
      }

      $http.post('/api/auth/forgot', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;

      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };

    // Change user password
    $scope.resetUserPassword = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'resetPasswordForm');

        return false;
      }

      $http.post('/api/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;

        // Attach user profile
        Authentication.user = response;

        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ProfilesController', ['$scope', '$stateParams', '$location', 'Profiles', 'Follow', 'Authentication', '$http',
  function ($scope, $stateParams, $location, Profiles, Follow, Authentication, $http) {
    $scope.user = Authentication.user;
    $scope.currentPage = 1;
    $scope.error = null;
    $scope.repliesError = null;
    $scope.perPage = 10;
    $scope.totalPages = Math.ceil($scope.totalReplies/$scope.perPage) || 1;


    // This is where we will have methods to display user profiles
    // Fetch a user's profile
    function applyProfile(profile) {
      $scope.profile = profile;
      // determine if we're following this user
      if (Authentication.user.following.indexOf(profile._id) > -1) {
        $scope.isFollowed = true;
      }
      if (Authentication.user._id === profile._id) {
        $scope.isMe = true;
      }
      $scope.userReplies(1);
    }
    
    $scope.findByUsername = function () {
      Profiles.findByUsername($stateParams.username)
      .then(function(profile){
        applyProfile(profile);
      }, function(errorMessage){
        $scope.error = errorMessage;
      });
    };

    // Fetch a user's top level replies and associated uttles
    function applyReplies(rObject) {
      $scope.theReplies = rObject.replies;
      $scope.perPage = rObject.perPage;
      $scope.totalReplies = rObject.total;
      $scope.totalPages = Math.ceil($scope.totalReplies/$scope.perPage);
    }

    $scope.userReplies = function (pageTo) {
      var userId = $scope.profile._id;
      var page = pageTo || 1;
      var perPage = $scope.perPage;

      Profiles.userReplies(pageTo, perPage, userId)
      .then(function(response){
        applyReplies(response);
      }, function(errorMessage){
        $scope.repliesError = errorMessage;
      });
    };

    function applyTopByReplies(topByReplies){
      $scope.topByReplies = topByReplies;
    }

    function applyTopBySubmissions(topBySubmissions){
      $scope.topBySubmissions = topBySubmissions;
    }

    function applyTopByFollowers(topByFollowers){
      $scope.topByFollowers = topByFollowers;
    }

    $scope.findProlific = function() {
      Profiles.findTopByReplies()
      .then(function(topByReplies) {
        applyTopByReplies(topByReplies);
      });

      Profiles.findTopBySubmissions()
      .then(function(topBySubmissions) {
        applyTopBySubmissions(topBySubmissions);
      });

      Follow.mostFollowers()
      .then(function(topByFollowers) {
        applyTopByFollowers(topByFollowers);
      });
    };

    $scope.follow = function(userId) {
      Follow.followUser(userId)
      .then(function(user){
        // on success
        $scope.isFollowed = true;        
      }, function(errorMessage){
        $scope.error = errorMessage;
      });
    };

    $scope.unfollow = function(userId) {
      Follow.unfollowUser(userId)
      .then(function(user){
        // on success
        $scope.isFollowed = false;        
      }, function(errorMessage){
        $scope.error = errorMessage;
      });
    };


  }
]);

'use strict';

angular.module('users').controller('ChangePasswordController', ['$scope', '$http', 'Authentication', 'PasswordValidator',
  function ($scope, $http, Authentication, PasswordValidator) {
    $scope.user = Authentication.user;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    // Change user password
    $scope.changeUserPassword = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'passwordForm');

        return false;
      }

      $http.post('/api/users/password', $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.$broadcast('show-errors-reset', 'passwordForm');
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('ChangeProfilePictureController', ['$scope', '$timeout', '$window', 'Authentication', 'FileUploader',
  function ($scope, $timeout, $window, Authentication, FileUploader) {
    $scope.user = Authentication.user;
    $scope.imageURL = $scope.user.profileImageURL;

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/users/picture',
      alias: 'newProfilePicture'
    });

    // Set file uploader image filter
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function (item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function (fileReaderEvent) {
          $timeout(function () {
            $scope.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Called after the user has successfully uploaded a new picture
    $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // Show success message
      $scope.success = true;

      // Populate user object
      $scope.user = Authentication.user = response;

      // Clear upload buttons
      $scope.cancelUpload();
    };

    // Called after the user has failed to uploaded a new picture
    $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // Clear upload buttons
      $scope.cancelUpload();

      // Show error message
      $scope.error = response.message;
    };

    // Change user profile picture
    $scope.uploadProfilePicture = function () {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    // Cancel the upload process
    $scope.cancelUpload = function () {
      $scope.uploader.clearQueue();
      $scope.imageURL = $scope.user.profileImageURL;
    };
  }
]);

'use strict';

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication',
  function ($scope, $http, $location, Users, Authentication) {
    $scope.user = Authentication.user;

    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      var user = new Users($scope.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'userForm');
        $scope.success = true;
        Authentication.user = response;
      }, function (response) {
        $scope.error = response.data.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('FollowController', ['$scope', '$http', '$location', 'Follow', 'Authentication',
  function ($scope, $http, $location, Follow, Authentication) {
    $scope.user = Authentication.user;

    function applyFollowers(followers){
      $scope.followers = followers;
    }

    function applyFollowing(following){
      $scope.following = following;
    }


    $scope.findFollows = function() {
      Follow.getFollowers()
      .then(function(followers) {
        applyFollowers(followers);
      });

      Follow.getFollowing()
      .then(function(following) {
        applyFollowing(following);
      });
    };


  }]);

'use strict';

angular.module('users').controller('SocialAccountsController', ['$scope', '$http', 'Authentication',
  function ($scope, $http, Authentication) {
    $scope.user = Authentication.user;

    // Check if there are additional accounts
    $scope.hasConnectedAdditionalSocialAccounts = function (provider) {
      for (var i in $scope.user.additionalProvidersData) {
        return true;
      }

      return false;
    };

    // Check if provider is already in use with current user
    $scope.isConnectedSocialAccount = function (provider) {
      return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
    };

    // Remove a user social account
    $scope.removeUserSocialAccount = function (provider) {
      $scope.success = $scope.error = null;

      $http.delete('/api/users/accounts', {
        params: {
          provider: provider
        }
      }).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.user = Authentication.user = response;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

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
'use strict';

angular.module('users').controller('SettingsController', ['$scope', 'Authentication',
  function ($scope, Authentication) {
    $scope.user = Authentication.user;
  }
]);

'use strict';

angular.module('users')
  .directive('passwordValidator', ['PasswordValidator', function(PasswordValidator) {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$validators.requirements = function (password) {
          var status = true;
          if (password) {
            var result = PasswordValidator.getResult(password);
            var requirementsIdx = 0;

            // Requirements Meter - visual indicator for users
            var requirementsMeter = [
              { color: 'danger', progress: '20' },
              { color: 'warning', progress: '40' },
              { color: 'info', progress: '60' },
              { color: 'primary', progress: '80' },
              { color: 'success', progress: '100' }
            ];

            if (result.errors.length < requirementsMeter.length) {
              requirementsIdx = requirementsMeter.length - result.errors.length - 1;
            }

            scope.requirementsColor = requirementsMeter[requirementsIdx].color;
            scope.requirementsProgress = requirementsMeter[requirementsIdx].progress;

            if (result.errors.length) {
              scope.popoverMsg = PasswordValidator.getPopoverMsg();
              scope.passwordErrors = result.errors;
              status = false;
            } else {
              scope.popoverMsg = '';
              scope.passwordErrors = [];
              status = true;
            }
          }
          return status;
        };
      }
    };
  }]);

'use strict';

angular.module('users')
  .directive('passwordVerify', [function() {
    return {
      require: 'ngModel',
      scope: {
        passwordVerify: '='
      },
      link: function(scope, element, attrs, ngModel) {
        var status = true;
        scope.$watch(function() {
          var combined;
          if (scope.passwordVerify || ngModel) {
            combined = scope.passwordVerify + '_' + ngModel;
          }
          return combined;
        }, function(value) {
          if (value) {
            ngModel.$validators.passwordVerify = function (password) {
              var origin = scope.passwordVerify;
              return (origin !== password) ? false : true;
            };
          }
        });
      }
    };
  }]);

'use strict';

// Users directive used to force lowercase input
angular.module('users').directive('lowercase', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, modelCtrl) {
      modelCtrl.$parsers.push(function (input) {
        return input ? input.toLowerCase() : '';
      });
      element.css('text-transform', 'lowercase');
    }
  };
});

'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window',
  function ($window) {
    var auth = {
      user: $window.user
    };

    return auth;
  }
]);

'use strict';

angular.module('users').factory('Follow', ['$http', '$q',
  function ($http, $q) {
    return({
      followUser: followUser,
      unfollowUser: unfollowUser,
      getFollowers: getFollowers,
      getFollowing: getFollowing,
      mostFollowers: mostFollowers
    });

    function followUser (userId) {
      var request = $http({
        url: '/api/user/follow/' + userId,
        method: 'PUT'
      });
      return(request.then(handleSuccess, handleError));
    }

    function unfollowUser (userId) {
      var request = $http({
        url: '/api/user/unfollow/' + userId,
        method: 'PUT'
      });
      return(request.then(handleSuccess, handleError));
    }   

    function getFollowers() {
      var request = $http({ 
        url: '/api/user/followers', 
        method: 'GET' 
      });
      return(request.then(handleSuccess, handleError));  
    }

    function getFollowing() {
      var request = $http({ 
        url: '/api/user/following', 
        method: 'GET' 
      });
      return(request.then(handleSuccess, handleError));        
    }

    function mostFollowers() {
      var request = $http({ 
        url: '/api/user/top/followers', 
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
'use strict';

// PasswordValidator service used for testing the password strength
angular.module('users').factory('PasswordValidator', ['$window',
  function ($window) {
    var owaspPasswordStrengthTest = $window.owaspPasswordStrengthTest;

    return {
      getResult: function (password) {
        var result = owaspPasswordStrengthTest.test(password);
        return result;
      },
      getPopoverMsg: function () {
        var popoverMsg = 'Please enter a passphrase or password with greater than 10 characters, numbers, lowercase, upppercase, and special characters.';
        return popoverMsg;
      }
    };
  }
]);

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
'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
  function ($resource) {
    return $resource('api/users', {}, {
      get: { method:'GET', cache: false },
      query: { method:'GET', cache: false, isArray:true },
      update: { method: 'PUT' }
    });
  }
]);

//TODO this should be Users service
angular.module('users.admin').factory('Admin', ['$resource',
  function ($resource) {
    return $resource('api/users/:userId', {
      userId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

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
            value: '0',
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
            value: '0',
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