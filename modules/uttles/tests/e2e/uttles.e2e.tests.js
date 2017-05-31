'use strict';

describe('Uttles E2E Tests:', function () {
  describe('Test uttles page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/uttles');
      expect(element.all(by.repeater('uttle in uttles')).count()).toEqual(0);
    });
  });
});
