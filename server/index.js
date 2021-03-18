const express = require('express');
const app = express();
const port = 3000;
const client = require('../db');
const morgan = require('morgan');

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
      console.log('err:', err);
      res.sendStatus(500);
    } else {
      res.send(data);
    }
  });
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});



// app.get('/db', (req, res) => {
//   client.fetchCities((err, data) => {
//     if (err) {
//       console.log('err:', err);
//       res.sendStatus(500);
//     } else {
//       res.send(data);
//     }
//   });
// })