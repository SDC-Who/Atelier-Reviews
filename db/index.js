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
    if (reviews.length === 0) { return cb(null, 'No reviews for that product ID.'); };
    reviews.forEach(review => {
      response.ratings[review.rating] = response.ratings[review.rating] ? (Number(response.ratings[review.rating]) + 1).toString() : '1';
      response.recommended[review.recommend] = response.recommended[review.recommend] ? (Number(response.recommended[review.recommend]) + 1).toString() : '1';
    });
    var review_ids = reviews.map(review => review.id.toString());
    client.query(`SELECT * FROM characteristic_reviews INNER JOIN characteristics ON characteristic_id = characteristics.id WHERE review_id IN (${review_ids.join(',')});`, (err, res) => {
      if (err) { return cb(err); };
      var characteristicReviews = res.rows;
      var characteristicCounter = {
        Fit: { totalScore: 0, count: 0 },
        Comfort: { totalScore: 0, count: 0 },
        Quality: { totalScore: 0, count: 0 },
        Size: { totalScore: 0, count: 0 },
        Length: { totalScore: 0, count: 0 },
        Width: { totalScore: 0, count: 0 }
      };
      characteristicReviews.forEach(review => {
        characteristicCounter[review.name].count++;
        characteristicCounter[review.name].totalScore += review.value;
        if (!response.characteristics[review.name]) {
          response.characteristics[review.name] = { id: review.id.toString(), value: 0 };
        }
      });
      var presentCharacteristics = Object.keys(response.characteristics);
      presentCharacteristics.forEach(characteristic => {
        var average = characteristicCounter[characteristic].totalScore / characteristicCounter[characteristic].count;
        response.characteristics[characteristic].value = average.toFixed(16).toString();
      });
      cb(null, response);
    });
  });
};

client.postReview = ({ product_id, rating, summary, body, recommend, name, email, photos, characteristics }, cb) => {

  // get the newest review ID that will be created
  client.query(`SELECT SETVAL('reviews_id_seq',MAX(id)+1) FROM reviews;`)

    .then(res => {
      var newReviewId = Number(res.rows[0].setval);

      // prepare data for inserting row in reviews

      var date = new Date().toISOString();
      var strings = [date, summary, body, name, email].map(string => {
        if (string.indexOf("'") !== -1) {
          string = string.split("'").join("''");
        }
        string = '\'' + string + '\'';
        return string;
      });
      var arrayOfData = [product_id, rating, recommend, strings];
      var reviewQuery = `INSERT INTO reviews(id, product_id, rating, recommend, date, summary, body, reviewer_name, reviewer_email) VALUES(${newReviewId},${arrayOfData.join(',')});`;

      client.query(reviewQuery)

        .then(() => {
          // can I insert more than one row in a single query?
          if (photos.length > 0) {
            var photosQuery = `INSERT INTO reviews_photos(id, review_id, url) VALUES((SELECT SETVAL('reviews_photos_id_seq',MAX(id)+1) FROM reviews_photos), ${newReviewId}, '${photos[0]}');`;
            console.log('photosQuery:', photosQuery);
            client.query(photosQuery)
            .then(res => {
              console.log('res.command:', res.command);
              return cb(null);
            })
          } else {
            cb(null);
          }
          // if there are characteristics, insert a row in characteristics AND characteristic_reviews
          if (Object.keys(characteristics).length > 0) {
            console.log('there be characteristics!');
          }
        })
    })
    .catch(err => cb(err));
};

// '3347471' should be 'Fit', '3347472' should be 'Length', '3347473' should be 'Comfort', '3347474' should be 'Quality'


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