const { Client } = require('pg');

const client = new Client({ database: 'mydb' });

client.fetchReviews = ({ product_id, count = 5, page = 1, sort = null }, cb) => {
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
        var newDate = new Date(review.date);
        review.date = newDate;
        var { reported } = review;
        delete review.reported;
        delete review.id;
        delete review.product_id;
        delete review.reviewer_email;
        if (reported !== true) {
          filteredReviews.push(review);
        }
      });
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
        if (sort) {
          if (sort === 'helpful') {
            filteredReviews.sort((a, b) => b.helpfulness - a.helpfulness);
          } else if (sort === 'newest') {
            filteredReviews.sort((a, b) => b.date - a.date);
          } else if (sort === 'relevant') {
            filteredReviews.sort((a,b) => b.helpfulness - a.helpfulness || b.date - a.date)
          }
        }
        response.results = filteredReviews;
        cb(null, response);
      });
    } else {
      response.results = [];
      cb(null, response);
    }
  });
};

client.fetchMetaData = (product_id, cb) => {
  var response = {
    product_id,
    ratings: {},
    recommended: {},
    characteristics: {}
  };
  client.query(`SELECT id, rating, recommend FROM reviews WHERE product_id = ${product_id};`, (err, res) => {
    if (err) { return cb(err); };
    var reviews = res.rows;
    console.log('reviews:', reviews);
    reviews.forEach(review => {
      response.ratings[review.rating] = response.ratings[review.rating] ? (Number(response.ratings[review.rating]) + 1).toString() : '1';
      response.recommended[review.recommend] = response.recommended[review.recommend] ? (Number(response.recommended[review.recommend]) + 1).toString() : '1';
    });
    // query database for characteristic reviews associated with each ID
    var review_ids = reviews.map(review => review.id.toString());
    client.query(`SELECT * FROM characteristic_reviews WHERE review_id IN (${review_ids.join(',')});`, (err, res) => {
      if (err) { return cb(err); };
      console.log('res.rows from characteristic_reviews:', res.rows);
      cb(null, response);
    });
    // cb(null, response);
  });
};

module.exports = client;

// client.sortByRelative() {
//   let maxHelpful = Math.max.apply(Math, this.state.displayReviews.map(function (o) {
//     return o.helpfulness;
//   }))
//   let maxDate = Math.max.apply(Math, this.state.displayReviews.map(function (o) {
//     return Math.round((new Date() - new Date(o.date)) / (1000 * 60 * 60 * 24))
//   }))
//   let sortByRelative = this.state.displayReviews.map(function (review) {
//     var o = Object.assign({}, review);
//     o.a_sort = (o.helpfulness / maxHelpful) + ((new Date(o.date) / (1000 * 60 * 60 * 24)) / maxDate)
//     return o;
//   })
//   return sortByRelative.sort(function (a, b) {
//     return -(a.sort - b.sort);
//   })
// };