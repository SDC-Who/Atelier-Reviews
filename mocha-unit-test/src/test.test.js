const app = require('../../server/index.js');
const client = require('../../db');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const should = chai.should();
const expect = chai.expect;

describe('Fetch Reviews', () => {

  it('should GET reviews', (done) => {
    chai.request(app)
      // .get(`/reviews?product_id=${Math.floor(Math.random() * 5000000)}`)
      .get('/reviews?product_id=1000010')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.keys(['product', 'page', 'count', 'results']);
        res.body.results.should.be.a('array');
        done();
      });
  });

  it('should GET reviews meta data', (done) => {
    chai.request(app)
      .get('/reviews/meta?product_id=1000010')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.keys(['productId', 'ratings', 'recommended', 'characteristics']);
        done();
      });
  });

});

describe('Post a review', () => {

  let latestReviewId;

  before((done) => {
    chai.request(app)
      .get('/reviews?product_id=19091&sort=newest')
      .end((err, res) => {
        latestReviewId = res.body.results[0].review_id;
        // latestReviewId = 0;
        done();
      });
  });

  let reviewToPost = {
    'product_id': 19091,
    'rating': 5,
    'summary': 'I\'m saying this was freakin\' INSANE DUDE',
    'body': 'like I said, INSANE',
    'recommend': true,
    'name': 'fchopin2',
    'email': 'rkelly2012@gmail.com',
    'photos': ['https://images.unsplash.com/photo-1553830591-d8632a99e6ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1511&q=80', 'https://images.unsplash.com/photo-1556812191-381c7e7d96d6?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2982&q=80'],
    'characteristics': {
      '64067': 5,
      '64068': 4,
      '64069': 3,
      '64070': 2
    }
  };

  let requestBody = JSON.stringify(reviewToPost);

  it('should post a review', (done) => {
    chai.request(app)
      .post('/reviews')
      .set('content-type', 'application/json')
      .send(requestBody)
      .end((err, res) => {
        res.should.have.status(201);
        done();
      });
  });

  it('should store posted review in database', (done) => {
    chai.request(app)
      .get('/reviews?product_id=19091&sort=newest')
      .end((err, res) => {
        let updatedLatestReviewId = res.body.results[0].review_id;
        expect(updatedLatestReviewId).to.be.greaterThan(latestReviewId);
        done();
      });
  });

});


describe('Edit Reviews', () => {

  describe('Edit "Helpful" property', () => {

      let helpfulCount;

      before((done) => {
        chai.request(app)
          .get('/reviews?product_id=50122&count=10')
          .end((err, res) => {
            for (var review of res.body.results) {
              if (review.review_id === 289129) {
                helpfulCount = review.helpfulness || 0;
                break;
              }
            }
            done();
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

  describe('Edit "Reported" property', () => {

    let mostRecentReviewId;

    before((done) => {
      chai.request(app)
        .get('/reviews?product_id=19091&sort=newest')
        .end((err, res) => {
          mostRecentReviewId = res.body.results[0].review_id;
          done();
        });
    });

    it('should submit "reported"', (done) => {
      chai.request(app)
        .put(`/reviews/${mostRecentReviewId}/report`)
        .end((err, res) => {
          res.should.have.status(204);
          done();
        });
    });

    it('should have removed review from circulation', (done) => {
      chai.request(app)
        .get('/reviews?product_id=19091&sort=newest')
        .end((err, res) => {
          let updatedMostRecentReviewId = res.body.results[0].review_id;
          updatedMostRecentReviewId.should.not.equal(mostRecentReviewId);
          done();
        });
    });

  });

});