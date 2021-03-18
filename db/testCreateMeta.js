const client = require('./index.js');
const csv = require('csv-parser');
const fs = require('fs');
const formatCSVRow = require('./formatCSVRow.js');

// id,product_id,rating,date,summary,body,recommend,reported,reviewer_name,reviewer_email,response,helpfulness,[photos]

const createMetaTableQuery = `
CREATE TABLE IF NOT EXISTS reviews_meta (
  id int PRIMARY KEY,
  ratings_1 int,
  ratings_2 int,
  ratings_3 int,
  ratings_4 int,
  ratings_5 int,
  recommended_true int,
  recommended_false int,
  characteristics_fit decimal,
  characteristics_quality decimal,
  characteristics_width decimal,
  characteristics_size decimal,
  characteristics_comfort decimal,
  characteristics_length decimal
);
`;



client.connect()

  .then(() => console.log('Connected to database!'))

  .catch(err => console.log('Error connecting to database:', err))

  .then(() => {
    // sample CSV: /Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/Atelier-Reviews/sample_data/sample_reviews.csv
    // actual CSV: /Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/_oldCSV/reviews.csv
    fs.createReadStream('/Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/_oldCSV/reviews.csv')
      .pipe(csv())
      .on('data', row => {
        row.photos = 'null';
        // process the row for consumption: check if it's the right data type and escape apostrophes
        var rowAsArray = formatCSVRow.formatReviewRow(row);
        // format the row into a query string
        var reviewQuery = `INSERT INTO reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness, photos) VALUES (${rowAsArray.join(', ')});`;
        // insert the row into database
        client.query(reviewQuery, (err, res) => {
          if (err) {
            console.log('err from reviewQuery:', err);
          // } else {
          //   console.log('res.command:', res.command);
          }
        });

      })

      .on('end', () => {
        console.log('CSV file successfully processed');
        // client.end();
      });

  });

  // .then(() => {
  //   // sample CSV: /Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/Atelier-Reviews/sample_data/sample_reviews.csv
  //   fs.createReadStream('/Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/_oldCSV/reviews.csv')
  //     .pipe(csv())
  //     .on('data', row => {
  //       row.photos = '';
  //       // query database to get the photos data
  //       client.query(`SELECT * FROM photos_sample WHERE review_id = ${row.id}`, (err, res) => {
  //         if (err) {
  //           console.log('err:', err);
  //         } else {
  //           row.photos = JSON.stringify(res.rows);
  //           // process the row for consumption: check if it's the right data type and escape apostrophes
  //           var rowAsArray = formatCSVRow.formatReviewRow(row);
  //           // format the row into a query string
  //           var reviewQuery = `INSERT INTO reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness, photos) VALUES (${rowAsArray.join(', ')});`;
  //           // console.log('reviewQuery:', reviewQuery);
  //           client.query(reviewQuery, (err, res) => {
  //             if (err) {
  //               console.log('err from reviewQuery:', err);
  //             // } else {
  //             //   console.log('res.command:', res.command);
  //             }
  //           });
  //         }
  //       });
  //     })
  //     .on('end', () => {
  //       console.log('CSV file successfully processed');
  //       // client.end();
  //     });

  // });