const express = require('express');
const app = express();
const port = 3002;
const bodyParser = require('body-parser');
const client = require('../db');
const morgan = require('morgan');

app.use(bodyParser.json());
app.use(morgan('dev'));
client.connect()
  .then(() => console.log('Connected to database!'))
  .catch(err => console.log('Error connecting to database:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/reviews', (req, res) => {
  client.fetchReviews(req.query, (err, data) => {
    if (err) {
      console.log('err from client.fetchReviews:', err);
      res.sendStatus(500);
    } else {
      res.send(data);
    }
  });
});

app.get('/reviews/meta', (req, res) => {
  client.fetchMetaData(req.query.product_id, (err, data) => {
    if (err) {
      console.log('err from client.fetchMetaData:', err);
      res.sendStatus(500);
    } else {
      res.send(data);
    }
  });
});

app.post('/reviews', (req, res) => {
  // console.log('req.body:', req.body);
  client.postReview(req.body, err => {
    if (err) {
      console.log('err from client.postReview:', err);
      res.sendStatus(500);
    } else {
      res.sendStatus(201);
    }
  })
});

app.put('/reviews/:review_id/report', (req, res) => {
  client.reportReview(req.params.review_id, err => {
    if (err) {
      console.log('err from client.updateReview:', err);
    } else {
      res.sendStatus(204);
    }
  });
});

app.put('/reviews/:review_id/helpful', (req, res) => {
  client.supportReview(req.params.review_id, err => {
    if (err) {
      console.log('err from client.supportReview:', err);
    } else {
      res.sendStatus(204);
    }
  });
});


app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});