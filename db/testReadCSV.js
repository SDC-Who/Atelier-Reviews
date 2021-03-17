const client = require('./index.js');
const csv = require('csv-parser');
const fs = require('fs');
const formatCSVRow = require('./formatCSVRow.js');

// id,product_id,rating,date,summary,body,recommend,reported,reviewer_name,reviewer_email,response,helpfulness,[photos]

// reading my sample_reviews CSV
// querying postgreSQL photos_sample db for associated photos for each row
// format the updated row into a query string
// input it into table

const createReviewsTableQuery = `
CREATE TABLE IF NOT EXISTS reviews (
  id int PRIMARY KEY,
  product_id int,
  rating int,
  date varchar(20),
  summary varchar(80),
  body varchar(255),
  recommend boolean,
  reported boolean,
  reviewer_name varchar(20),
  reviewer_email varchar(50),
  response varchar(80),
  helpfulness int,
  photos jsonb
);
`;

client.connect()

  .then(() => console.log('Connected to database!'))

  .catch(err => console.log('Error connecting to database:', err))

  .then(() => {

    client.query(createReviewsTableQuery, (err, res) => {
      if (err) {
        console.log('err from db:', err);
      } else {
        console.log('res.command:', res.command);
      }
    });
  })

  .then(() => {

    fs.createReadStream('/Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/Atelier-Reviews/sample_data/sample_reviews.csv')
      .pipe(csv())
      .on('data', row => {
        row.photos = '';
        // query database to get the photos data
        client.query(`SELECT * FROM photos_sample WHERE review_id = ${row.id}`, (err, res) => {
          if (err) {
            console.log('err:', err);
          } else {
            row.photos = JSON.stringify(res.rows);
            // process the row for consumption: check if it's the right data type and escape apostrophes
            var rowAsArray = formatCSVRow.formatReviewRow(row);
            // format the row into a query string
            var reviewQuery = `INSERT INTO reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness, photos) VALUES (${rowAsArray.join(', ')});`;
            // console.log('reviewQuery:', reviewQuery);
            client.query(reviewQuery, (err, res) => {
              if (err) {
                console.log('err from reviewQuery:', err);
              } else {
                console.log('res.command:', res.command);
              }
            });
          }
        });
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
        // client.end();
      });

  });

  // INSERT INTO reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness, photos) VALUES (8, 2, 4, '2019-06-23', 'I am liking these glasses', 'They are very dark.  But that''s good because I''m in very sunny spots', true, false, 'bigbrotherbenjamin', 'first.last@gmail.com', 'Glad you''re enjoying the product!', 5, '[]');