const { Client } = require('pg');

const client = new Client({ database: 'mydb' });

const createReviewsTableQuery = `
CREATE TABLE IF NOT EXISTS reviews (
  id int PRIMARY KEY,
  ratings jsonb,
  recommended jsonb,
  characteristics jsonb
);
`;

// id,product_id,rating,date,summary,body,recommend,reported,reviewer_name,reviewer_email,response,helpfulness
// 1,1,5,"2019-01-01","This product was great!","I really did or did not like this product based on whether it was sustainably sourced.  Then I found out that its made from nothing at all.",true,false,"funtime","first.last@gmail.com",,8

const insertReviewQuery = `
INSERT INTO reviews (id, ratings, recommended, characteristics)
VALUES (1, '{
    "2": "1",
    "3": "1",
    "4": "5",
    "5": "1"
  }',
  '{
    "false": "2",
    "true": "3"
  }',
  '{
    "Quality": "4.20000000"
  }')
`;

client.createReviewsTable = cb => {
  client.query(createReviewsTableQuery, (err, res) => {
    if (err) {
      cb(err);
    } else {
      cb(null, res);
      // client.end();
    }
  });
};

client.insertReview = cb => {
  client.query(insertReviewQuery, (err, res) => {
    if (err) {
      cb(err);
    } else {
      cb(null, res);
      client.end();
    }
  });
}


client.fetchCities = cb => {
  client.query('SELECT * FROM cities;')
  .then(res => cb(null, res.rows))
  .catch(err => cb(err));
};

module.exports = client;

// client.query('SELECT NOW()', (err, res) => {
//   console.log(err, res);
//   client.end();
// });

/*

client.connect()
  .then(() => client.query('SELECT * FROM cities;'))
  .then(res => console.log('res.rows:', res.rows))
  .catch(err => console.log('err:', err))
  .finally(() => client.end());

*/