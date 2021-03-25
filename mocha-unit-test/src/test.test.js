const app = require('../../server/index.js');
const client = require('../../db');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const should = chai.should();

describe('Fetch Reviews', () => {

  it('should GET reviews', (done) => {
    chai.request(app)
      .get('/reviews?product_id=1000009')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });

  it('should GET reviews meta data', (done) => {
    chai.request(app)
      .get('/reviews/meta?product_id=1000010')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  });

});

describe('Edit Reviews', () => {

  let helpfulCount;

  before(() => {
    chai.request(app)
      .get('/reviews?product_id=50122&count=10')
      .end((err, res) => {
        for (var review of res.body.results) {
          if (review.review_id === 289129) {
            helpfulCount = review.helpfulness || 0;
            break;
          }
        }
      });
  });

  it('should submit "helpful"', (done) => {
    chai.request(app)
      .put('/reviews/289129/helpful')
      .end((err, res) => {
        res.should.have.status(204);
        done();
      })
  });

  it('should have incremented the helpful property', (done) => {
    chai.request(app)
      .get('/reviews?product_id=50122&count=10')
      .end((err, res) => {
        let updatedHelpfulness;
        for (var review of res.body.results) {
          if (review.review_id === 289129) {
            updatedHelpfulness = review.helpfulness;
            break;
          }
        }
        updatedHelpfulness.should.equal(helpfulCount + 1);
        done();
      });
  });

});

describe('Post a review', () => {



});