const { Client } = require('pg');

const client = new Client({ database: 'mydb' });

client.fetchReviews = ({ product_id, count = 5, page = 1 }, cb) => {
  // console.log('product_id, count, page from client:', product_id, count, page);
  // query client for reviews with this product_id
  client.query(`SELECT * FROM reviews WHERE product_id = ${product_id};`, (err, res) => {
    if (err) { return cb(err); };
    var reviews = res.rows;
    console.log('reviews:', reviews);
    if (reviews.length > 0) {
      var review_ids = reviews.map(review => review.id.toString());
      client.query(`SELECT * FROM reviews_photos WHERE review_id IN (${review_ids.join(',')});`, (err, res) => {
        if (err) { return cb(err); };
        var photos = res.rows;
        console.log('photos:', photos);
        cb(null, 'temp');
      });
    } else {
      cb(null, 'no photos');
    }
  });
};

module.exports = client;