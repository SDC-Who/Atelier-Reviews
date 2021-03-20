const { Client } = require('pg');

const client = new Client({ database: 'mydb' });

client.fetchReviews = ({ product_id, count = 5, page = 1, sort = null }, cb) => {
  const response = {
    product: product_id,
    page: Number(page) - 1,
    count: Number(count),
  };
  client.query(`SELECT * FROM reviews WHERE product_id = ${product_id} LIMIT ${response.count} OFFSET ${response.page * response.count};`, (err, res) => {
    if (err) { return cb(err); }
    const reviews = res.rows;
    if (reviews.length > 0) {
      const filteredReviews = [];
      reviews.forEach((review) => {
        const updatedReview = review;
        updatedReview.photos = [];
        updatedReview.review_id = review.id;
        const newDate = new Date(review.date);
        updatedReview.date = newDate;
        const { reported } = review;
        delete updatedReview.reported;
        delete updatedReview.id;
        delete updatedReview.productId;
        delete updatedReview.reviewer_email;
        if (reported !== true) {
          filteredReviews.push(review);
        }
      });

      const reviewIds = filteredReviews.map((review) => review.review_id.toString());
      client.query(`SELECT * FROM reviews_photos WHERE review_id IN (${reviewIds.join(',')});`, (err2, res2) => {
        if (err2) { return cb(err2); }
        const photos = res2.rows;
        photos.forEach((photo) => {
          const updatedPhoto = photo;
          const reviewId = updatedPhoto.review_id;
          delete updatedPhoto.review_id;
          filteredReviews.forEach((review) => {
            if (review.review_id === reviewId) {
              review.photos.push(updatedPhoto);
            }
          });
        });
        if (sort) {
          if (sort === 'helpful') {
            filteredReviews.sort((a, b) => b.helpfulness - a.helpfulness);
          } else if (sort === 'newest') {
            filteredReviews.sort((a, b) => b.date - a.date);
          } else if (sort === 'relevant') {
            filteredReviews.sort((a, b) => b.helpfulness - a.helpfulness || b.date - a.date);
          }
        }
        response.results = filteredReviews;
        return cb(null, response);
      });
    } else {
      response.results = [];
      return cb(null, response);
    }
    return undefined;
  });
};

client.fetchMetaData = (productId, cb) => {
  const response = {
    productId,
    ratings: {},
    recommended: {},
    characteristics: {},
  };
  client.query(`SELECT id, rating, recommend FROM reviews WHERE product_id = ${productId};`, (err, res) => {
    if (err) { return cb(err); }
    const reviews = res.rows;
    if (reviews.length === 0) { return cb(null, 'No reviews for that product ID.'); }
    reviews.forEach((review) => {
      response.ratings[review.rating] = response.ratings[review.rating] ? (Number(response.ratings[review.rating]) + 1).toString() : '1';
      response.recommended[review.recommend] = response.recommended[review.recommend] ? (Number(response.recommended[review.recommend]) + 1).toString() : '1';
    });
    const reviewIds = reviews.map((review) => review.id.toString());
    client.query(`SELECT * FROM characteristic_reviews INNER JOIN characteristics ON characteristic_id = characteristics.id WHERE review_id IN (${reviewIds.join(',')});`, (err2, res2) => {
      if (err2) { return cb(err2); }
      const characteristicReviews = res2.rows;
      const charCounter = {
        Fit: { totalScore: 0, count: 0 },
        Comfort: { totalScore: 0, count: 0 },
        Quality: { totalScore: 0, count: 0 },
        Size: { totalScore: 0, count: 0 },
        Length: { totalScore: 0, count: 0 },
        Width: { totalScore: 0, count: 0 },
      };
      characteristicReviews.forEach((review) => {
        charCounter[review.name].count += 1;
        charCounter[review.name].totalScore += review.value;
        if (!response.characteristics[review.name]) {
          response.characteristics[review.name] = { id: review.id.toString(), value: 0 };
        }
      });
      const presentCharacteristics = Object.keys(response.characteristics);
      presentCharacteristics.forEach((characteristic) => {
        const average = charCounter[characteristic].totalScore / charCounter[characteristic].count;
        response.characteristics[characteristic].value = average.toFixed(16).toString();
      });
      return cb(null, response);
    });
    return undefined;
  });
};

client.postReview = (rvw, cb) => {
  const { product_id, rating, summary, body, recommend, name, email, photos, characteristics } = rvw;
  client.query('SELECT SETVAL(\'reviews_id_seq\',MAX(id)+1) FROM reviews;')

    .then(() => {
      // const newReviewId = Number(res.rows[0].setval);
      const date = new Date().toISOString();
      const strings = [date, summary, body, name, email].map((string) => {
        let formattedString = string;
        if (formattedString.indexOf("'") !== -1) {
          formattedString = formattedString.split("'").join("''");
        }
        formattedString = `' ${formattedString} '`;
        return formattedString;
      });
      const arrayOfData = [product_id, rating, recommend, strings];
      const reviewQuery = `INSERT INTO reviews(id, product_id, rating, recommend, date, summary, body, reviewer_name, reviewer_email) VALUES((SELECT SETVAL('reviews_id_seq',MAX(id)+1) FROM reviews),${arrayOfData.join(',')}) RETURNING id;`;

      client.query(reviewQuery)

        .then((res) => {
          const myPromises = [];
          const newReviewId = res.rows[0].id;

          if (photos.length > 0) {
            const photoQueries = photos.map((photo, index) => `((SELECT SETVAL('reviews_photos_id_seq',MAX(id)+${index + 1}) FROM reviews_photos), ${newReviewId}, ${`' ${photo} '`})`);
            const photosQuery = `INSERT INTO reviews_photos(id, review_id, url) VALUES ${photoQueries.join(', ')};`;
            myPromises.push(client.query(photosQuery));
          }

          const characteristicIds = Object.keys(characteristics);
          if (characteristicIds.length > 0) {
            const characteristicsQueries = characteristicIds.map((characteristicId, index) => `((SELECT SETVAL('characteristic_reviews_id_seq',MAX(id)+${index + 1}) FROM characteristic_reviews), ${newReviewId}, ${characteristicId}, ${characteristics[characteristicId]})`);
            const characteristicsQuery = `INSERT INTO characteristic_reviews (id, review_id, characteristic_id, value) VALUES ${characteristicsQueries.join(', ')};`;
            myPromises.push(client.query(characteristicsQuery));
          }

          Promise.all(myPromises)

            .then(() => cb(null))

            .catch((err) => cb(err));
        })
        .catch((err) => cb(err));
    })
    .catch((err) => cb(err));
};

client.reportReview = (reviewId, cb) => {
  const reportQuery = `UPDATE reviews SET reported = true WHERE id = ${reviewId};`;
  client.query(reportQuery)
    .then(() => cb(null))
    .catch((err) => cb(err));
};

client.supportReview = (reviewId, cb) => {
  client.query(`SELECT helpfulness FROM reviews WHERE id = ${reviewId}`)
    .then((res) => {
      const helpfulnessQuery = `UPDATE reviews SET helpfulness = ${res.rows[0].helpfulness + 1} WHERE id = ${reviewId};`;
      return client.query(helpfulnessQuery);
    })
    .then(() => cb(null))
    .catch((err) => cb(err));
};

module.exports = client;
