const { Client } = require('pg');

const client = new Client({ database: 'mydb' });

client.fetchReviews = ({ product_id, count = 5, page = 1 }, cb) => {
  console.log('product_id, count, page from client:', product_id, count, page);
  // query client for reviews with this product_id
  client.query(`SELECT * FROM reviews WHERE product_id = ${product_id};`, (err, res) => {
    if (err) { return cb(err); };
    console.log('res.rows:', res.rows);
    cb(null, res.rows);
  });
};

module.exports = client;