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

  client.query(`SELECT SETVAL('reviews_id_seq',MAX(id)+1) FROM reviews;`)

    .then(res => {
      var newReviewId = Number(res.rows[0].setval);
      var date = new Date().toISOString();
      var strings = [date, summary, body, name, email].map(string => {
        if (string.indexOf("'") !== -1) {
          string = string.split("'").join("''");
        }
        string = '\'' + string + '\'';
        return string;
      });
      var arrayOfData = [product_id, rating, recommend, strings];
      var reviewQuery = `INSERT INTO reviews(id, product_id, rating, recommend, date, summary, body, reviewer_name, reviewer_email) VALUES((SELECT SETVAL('reviews_id_seq',MAX(id)+1) FROM reviews),${arrayOfData.join(',')}) RETURNING id;`;

      client.query(reviewQuery)

        .then(res => {
          var myPromises = [];
          var newReviewId = res.rows[0].id;

          if (photos.length > 0) {
            var photosQueries = photos.map((photo, index) => {
              return `((SELECT SETVAL('reviews_photos_id_seq',MAX(id)+${index + 1}) FROM reviews_photos), ${newReviewId}, ${'\'' + photo + '\''})`;
            });
            var photosQuery = `INSERT INTO reviews_photos(id, review_id, url) VALUES ${photosQueries.join(', ')};`;
            myPromises.push(client.query(photosQuery));
          }

          var characteristicIds = Object.keys(characteristics);
          if (characteristicIds.length > 0) {
            var characteristicsQueries = characteristicIds.map((characteristicId, index) => {
              return `((SELECT SETVAL('characteristic_reviews_id_seq',MAX(id)+${index + 1}) FROM characteristic_reviews), ${newReviewId}, ${characteristicId}, ${characteristics[characteristicId]})`;
            });
            var characteristicsQuery = `INSERT INTO characteristic_reviews (id, review_id, characteristic_id, value) VALUES ${characteristicsQueries.join(', ')};`;
            myPromises.push(client.query(characteristicsQuery));
          }

          Promise.all(myPromises)

          .then(() => cb(null))

          .catch(err => cb(err));
        })
    })
    .catch(err => cb(err));
};

client.reportReview = (review_id, cb) => {
  var reportQuery = `UPDATE reviews SET reported = true WHERE id = ${review_id};`;
  client.query(reportQuery)
  .then(() => cb(null))
  .catch(err => cb(err));
};

client.supportReview = (review_id, cb) => {
  client.query(`SELECT helpfulness FROM reviews WHERE id = ${review_id}`)
  .then(res => {
    var helpfulnessQuery = `UPDATE reviews SET helpfulness = ${res.rows[0].helpfulness + 1} WHERE id = ${review_id};`;
    console.log('helpfulnessQuery:', helpfulnessQuery);
    return client.query(helpfulnessQuery);
  })
  .then(() => cb(null))
  .catch(err => cb(err));
};

module.exports = client;