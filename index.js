const client = require('./db');

client.connect()
  .then(() => console.log('Connected to database!'))
  .catch(err => console.log('Error connecting to database:', err))
  .then(() => client.createReviewsTable((err, res) => {
    if (err) {
      console.log('err from db:', err);
    } else {
      console.log('res.command:', res.command);
    }
  }))
  .then(() => client.insertReview((err, res) => {
    if (err) {
      console.log('err from db:', err);
    } else {
      console.log('res.command:', res.command);
    }
  }));
  // .finally(() => client.end());