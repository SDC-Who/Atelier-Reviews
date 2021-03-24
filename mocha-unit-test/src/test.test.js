const chai = require("chai");
const expect = chai.expect;

describe('Baby\'s first test!', () => {
  it('should talk', () => {
    var babyTalk = 'goo goo ga ga?';
    expect(babyTalk).to.equal('goo goo ga ga?');
  });
});
