const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const client = require('../db');
const config = require('../config.js');

const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(morgan('dev'));
client.connect()
  .then(() => console.log('Connected to database!'))
  .catch((err) => console.log('Error connecting to database:', err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get(`/${config.loaderToken}`, (req, res) => {
  res.send('Hello, Loader!');
});

app.get(`/${config.loaderToken}.html`, (req, res) => {
  res.send('Hello, Loader!');
});

app.get(`/${config.loaderToken}.txt`, (req, res) => {
  res.send('Hello, Loader!');
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
  client.postReview(req.body, (err) => {
    if (err) {
      console.log('err from client.postReview:', err);
      res.sendStatus(500);
    } else {
      res.sendStatus(201);
    }
  });
});

app.put('/reviews/:review_id/report', (req, res) => {
  client.reportReview(req.params.review_id, (err) => {
    if (err) {
      console.log('err from client.updateReview:', err);
    } else {
      res.sendStatus(204);
    }
  });
});

app.put('/reviews/:review_id/helpful', (req, res) => {
  client.supportReview(req.params.review_id, (err) => {
    if (err) {
      console.log('err from client.supportReview:', err);
    } else {
      res.sendStatus(204);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is listening in at http://localhost:${port}`);
});
// server ec2 instance: ec2-18-216-109-204.us-east-2.compute.amazonaws.com