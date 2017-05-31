'use strict';

(function () {
  // Uttles Controller Spec
  describe('Uttles Controller Tests', function () {
    // Initialize global variables
    var UttlesController,
      scope,
      $httpBackend,
      $stateParams,
      $location,
      Authentication,
      Uttles,
      mockUttle;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Uttles_) {
      // Set a new global scope
      scope = $rootScope.$new();

      // Point global variables to injected services
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      Authentication = _Authentication_;
      Uttles = _Uttles_;

      // create mock uttle
      mockUttle = new Uttles({
        _id: '525a8422f6d0f87f0e407a33',
        title: 'An Uttle about MEAN',
        content: 'MEAN rocks!'
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Uttles controller.
      UttlesController = $controller('UttlesController', {
        $scope: scope
      });
    }));

    it('$scope.find() should create an array with at least one uttle object fetched from XHR', inject(function (Uttles) {
      // Create a sample uttles array that includes the new uttle
      var sampleUttles = [mockUttle];

      // Set GET response
      $httpBackend.expectGET('api/uttles').respond(sampleUttles);

      // Run controller functionality
      scope.find();
      $httpBackend.flush();

      // Test scope value
      expect(scope.uttles).toEqualData(sampleUttles);
    }));

    it('$scope.findOne() should create an array with one uttle object fetched from XHR using a uttleId URL parameter', inject(function (Uttles) {
      // Set the URL parameter
      $stateParams.uttleId = mockUttle._id;

      // Set GET response
      $httpBackend.expectGET(/api\/uttles\/([0-9a-fA-F]{24})$/).respond(mockUttle);

      // Run controller functionality
      scope.findOne();
      $httpBackend.flush();

      // Test scope value
      expect(scope.uttle).toEqualData(mockUttle);
    }));

    describe('$scope.create()', function () {
      var sampleUttlePostData;

      beforeEach(function () {
        // Create a sample uttle object
        sampleUttlePostData = new Uttles({
          title: 'An Uttle about MEAN',
          content: 'MEAN rocks!'
        });

        // Fixture mock form input values
        scope.title = 'An Uttle about MEAN';
        scope.content = 'MEAN rocks!';

        spyOn($location, 'path');
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (Uttles) {
        // Set POST response
        $httpBackend.expectPOST('api/uttles', sampleUttlePostData).respond(mockUttle);

        // Run controller functionality
        scope.create(true);
        $httpBackend.flush();

        // Test form inputs are reset
        expect(scope.title).toEqual('');
        expect(scope.content).toEqual('');

        // Test URL redirection after the uttle was created
        expect($location.path.calls.mostRecent().args[0]).toBe('uttles/' + mockUttle._id);
      }));

      it('should set scope.error if save error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/uttles', sampleUttlePostData).respond(400, {
          message: errorMessage
        });

        scope.create(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      });
    });

    describe('$scope.update()', function () {
      beforeEach(function () {
        // Mock uttle in scope
        scope.uttle = mockUttle;
      });

      it('should update a valid uttle', inject(function (Uttles) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/uttles\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        scope.update(true);
        $httpBackend.flush();

        // Test URL location to new object
        expect($location.path()).toBe('/uttles/' + mockUttle._id);
      }));

      it('should set scope.error to error response message', inject(function (Uttles) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/uttles\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        scope.update(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      }));
    });

    describe('$scope.remove(uttle)', function () {
      beforeEach(function () {
        // Create new uttles array and include the uttle
        scope.uttles = [mockUttle, {}];

        // Set expected DELETE response
        $httpBackend.expectDELETE(/api\/uttles\/([0-9a-fA-F]{24})$/).respond(204);

        // Run controller functionality
        scope.remove(mockUttle);
      });

      it('should send a DELETE request with a valid uttleId and remove the uttle from the scope', inject(function (Uttles) {
        expect(scope.uttles.length).toBe(1);
      }));
    });

    describe('scope.remove()', function () {
      beforeEach(function () {
        spyOn($location, 'path');
        scope.uttle = mockUttle;

        $httpBackend.expectDELETE(/api\/uttles\/([0-9a-fA-F]{24})$/).respond(204);

        scope.remove();
        $httpBackend.flush();
      });

      it('should redirect to uttles', function () {
        expect($location.path).toHaveBeenCalledWith('uttles');
      });
    });
  });
}());
