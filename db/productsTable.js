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

module.exports.createProductsTable = cb => {
  client.query(createProductsTableQuery, (err, res) => {
    if (err) {
      cb(err);
    } else {
      cb(null, res);
      // client.end();
    }
  });
};

module.exports.insertProduct = cb => {
  client.query(insertProductQuery, (err, res) => {
    if (err) {
      cb(err);
    } else {
      cb(null, res);
      client.end();
    }
  });
}