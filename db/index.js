const { Client } = require('pg');
const formatReviews = require('./formatReviews.js');
// const productsTable = require('./productsTable.js');

const client = new Client({ database: 'mydb' });

// REVIEWS – CREATE TABLE

const createReviewsTableQuery = `
CREATE TABLE IF NOT EXISTS reviews (
  id int PRIMARY KEY,
  rating int,
  summary varchar(80),
  recommend boolean,
  response varchar(80),
  reported boolean,
  body varchar(255),
  date varchar(20),
  reviewer_name varchar(20),
  email varchar(20),
  helpfulness int,
  photos jsonb,
  product_id int
);
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

// REVIEWS – INSERT ROW

var string1FromCSV = '1,1,5,"2019-01-01","This product was great!","I really did or did not like this product based on whether it was sustainably sourced.  Then I found out that its made from nothing at all.",true,false,"funtime","first.last@gmail.com",,8';
var string2FromCSV = '5,2,3,"2019-04-14","I\'m enjoying wearing these shades","Comfortable and practical.",true,false,"shortandsweeet","first.last@gmail.com",,5';

client.insertReview = cb => {
  var myOrderedArray = formatReviews.createOrderedArrayFromString(string1FromCSV);
  // query db to get the photos for this review
  client.query(`SELECT * FROM photos_sample WHERE review_id = ${myOrderedArray[0]}`, (err, res) => {
    if (err) {
      cb(err);
    } else {
      // append result to the array that resulted
      console.log('res.rows from photos query:', res.rows);
      myOrderedArray[11] = '\'' + JSON.stringify(res.rows) + '\''; // photos array
      // format query string from completed array
      var myQuery = formatReviews.createReviewQuery(myOrderedArray);
      console.log('myQuery:', myQuery);
      client.query(myQuery, (err, res) => {
        if (err) {
          cb(err);
        } else {
          cb(null, res);
          client.end();
        }
      });
    }
  });
};


// id,product_id,rating,date,summary,body,recommend,reported,reviewer_name,reviewer_email,response,helpfulness
// 1,1,5,"2019-01-01","This product was great!","I really did or did not like this product based on whether it was sustainably sourced.  Then I found out that its made from nothing at all.",true,false,"funtime","first.last@gmail.com",,8

const insertReviewQuery = `
INSERT INTO reviews (id, rating, summary, recommend, response, reported, body, date, reviewer_name, email, helpfulness, product_id)
VALUES (1, 5, 'This product was great!', true, null, false, 'I really did or did not like this product based on whether it was sustainably sourced.  Then I found out that its made from nothing at all.', '2019-01-01', 'funtime', 'first.last@gmail.com', 8, 1)
`;

var createReviewQuery = (array) => {
  return `
    INSERT INTO reviews (id, rating, summary, recommend, response, reported, body, date, reviewer_name, email, helpfulness, product_id)
    VALUES (${array.join(', ').slice(0, -2)})
  `;
};



// PRODUCTS TABLE (reviews meta data)

// DEFINE QUERIES

const createProductsTableQuery = `
CREATE TABLE IF NOT EXISTS products (
  id int PRIMARY KEY,
  ratings jsonb,
  recommended jsonb,
  characteristics jsonb
);
`;

// id,product_id,rating,date,summary,body,recommend,reported,reviewer_name,reviewer_email,response,helpfulness
// 1,1,5,"2019-01-01","This product was great!","I really did or did not like this product based on whether it was sustainably sourced.  Then I found out that its made from nothing at all.",true,false,"funtime","first.last@gmail.com",,8

const insertProductQuery = `
INSERT INTO products (id, ratings, recommended, characteristics)
VALUES (2, '{
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

// MAKE QUERIES

client.createProductsTable = cb => {
  client.query(createProductsTableQuery, (err, res) => {
    if (err) {
      cb(err);
    } else {
      cb(null, res);
      // client.end();
    }
  });
};

client.insertProduct = insertProduct = cb => {
  client.query(insertProductQuery, (err, res) => {
    if (err) {
      cb(err);
    } else {
      cb(null, res);
      client.end();
    }
  });
};

// -----------------------------------------------------
// this is for testing client/server connection

client.fetchCities = cb => {
  client.query('SELECT * FROM cities;')
  .then(res => cb(null, res.rows))
  .catch(err => cb(err));
};

// -----------------------------------------------------

module.exports = client;