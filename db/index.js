const { Client } = require('pg');

const client = new Client({ database: 'mydb' });

client.fetchReviews = ({ product_id, count = 5, page = 1 }, cb) => {
  var response = {
    product: product_id,
    page: Number(page) - 1,
    count: Number(count)
  };
  client.query(`SELECT * FROM reviews WHERE product_id = ${product_id} LIMIT ${response.count} OFFSET ${response.page * response.count};`, (err, res) => {
    if (err) { return cb(err); };
    var reviews = res.rows;
    if (reviews.length > 0) {
      var filteredReviews = [];
      reviews.forEach(review => {
        review.photos = [];
        review.review_id = review.id;
        var { reported } = review;
        delete review.reported;
        delete review.id;
        delete review.product_id;
        delete review.reviewer_email;
        if (reported !== true) {
          filteredReviews.push(review);
        }
      });
      // console.log('filteredReviews:', filteredReviews);
      var review_ids = filteredReviews.map(review => review.review_id.toString());
      client.query(`SELECT * FROM reviews_photos WHERE review_id IN (${review_ids.join(',')});`, (err, res) => {
        if (err) { return cb(err); };
        var photos = res.rows;
        photos.forEach(photo => {
          var { review_id } = photo;
          delete photo.review_id;
          filteredReviews.forEach(review => {
            if (review.review_id === review_id) {
              review.photos.push(photo);
            }
          })
        });
        // console.log('photos:', photos);
        response.results = filteredReviews;
        cb(null, response);
      });
    } else {
      response.results = [];
      cb(null, response);
    }
  });
};

module.exports = client;