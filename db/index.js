const { Client } = require('pg');

const client = new Client({ database: 'mydb' });

client.fetchReviews = ({ product_id, count = 5, page = 1 }, cb) => {
  client.query(`SELECT * FROM reviews WHERE product_id = ${product_id};`, (err, res) => {
    if (err) { return cb(err); };
    var reviews = res.rows;
    reviews.forEach(review => {
      review.photos = [];
      review.review_id = review.id;
      delete review.id;
      delete review.product_id;
    });
    console.log('reviews:', reviews);
    if (reviews.length > 0) {
      var review_ids = reviews.map(review => review.review_id.toString());
      client.query(`SELECT * FROM reviews_photos WHERE review_id IN (${review_ids.join(',')});`, (err, res) => {
        if (err) { return cb(err); };
        var photos = res.rows;
        photos.forEach(photo => {
          var { review_id } = photo;
          delete photo.review_id;
          reviews.forEach(review => {
            if (review.review_id === review_id) {
              review.photos.push(photo);
            }
          })
        });
        console.log('photos:', photos);
        cb(null, reviews);
      });
    } else {
      cb(null, reviews);
    }
  });
};

module.exports = client;