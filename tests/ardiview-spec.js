describe('arduiview end to end test', function() {
  it('should have a title', function() {
    browser.get('http://arduiview.herokuapp.com/');

    expect(browser.getTitle()).toEqual('Arduiview');

  });
});