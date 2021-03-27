// reviews

// store reviewer_name and response to a different table?

`CREATE TABLE IF NOT EXISTS reviews_contact (
  contact_id SERIAL PRIMARY KEY,
  review_id int,
  reviewer_email varchar(50),
  response varchar(255),
  CONSTRAINT fk_contact
    FOREIGN KEY(review_id)
      REFERENCES reviews(id)
);`

// I want review_id from reviews(id), reviewer_email from reviews(reviewer_email), and response from reviews(response)

`INSERT INTO reviews_contact (review_id, reviewer_email, response)
SELECT id, reviewer_email, response FROM reviews;`

`CREATE INDEX review_contact_index ON reviews_contact(review_id) INCLUDE (reviewer_email, response);`

`ALTER TABLE reviews DROP COLUMN reviewer_email, DROP COLUMN response`;

// EC2: /tmp/dataDump/
`COPY reviews_contact(id, reviewer_name, response)
FROM '/tmp/dataDump/reviews.csv'
DELIMITER ','
CSV HEADER;`
// and then rename column "id" as review_id

// should body be "text" (and thus flexible!) ??

`CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id int,
  rating int,
  date varchar(25),
  summary varchar(255),
  body text,
  recommend boolean,
  reported boolean,
  reviewer_name varchar(50),
  reviewer_email varchar(50),
  response varchar(255),
  helpfulness int
);`

// EC2: /tmp/dataDump/
`COPY reviews(id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
FROM '/tmp/dataDump/reviews.csv'
DELIMITER ','
CSV HEADER;`

// LOCAL
`COPY reviews(id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
FROM '/Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/_oldCSV/reviews.csv'
DELIMITER ','
CSV HEADER;`

// (had to omit INCLUDE onwards on EC2)
`CREATE INDEX product_id_index ON reviews(product_id) INCLUDE (id, rating, date, summary, body, recommend, reported, helpfulness);`

// reviews_photos

`CREATE TABLE IF NOT EXISTS reviews_photos (
  id SERIAL PRIMARY KEY,
  review_id int,
  url varchar(255),
  CONSTRAINT fk_photos
  FOREIGN KEY(review_id)
    REFERENCES reviews(id)
);`

// EC2: /tmp/dataDump/
`COPY reviews_photos(id, review_id, url)
FROM '/tmp/dataDump/reviews_photos.csv'
DELIMITER ','
CSV HEADER;`

// LOCAL
`COPY reviews_photos(id, review_id, url)
FROM '/Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/_oldCSV/reviews_photos.csv'
DELIMITER ','
CSV HEADER;`

`CREATE INDEX review_id_index ON reviews_photos(review_id) INCLUDE (id, url);`

// characteristics

`CREATE TABLE IF NOT EXISTS characteristics (
  id SERIAL PRIMARY KEY,
  product_id int,
  name varchar(7)
);`

// EC2: /tmp/dataDump/

`COPY characteristics(id, product_id, name)
FROM '/tmp/dataDump/characteristics.csv'
DELIMITER ','
CSV HEADER;`

// local

`COPY characteristics(id, product_id, name)
FROM '/Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/_oldCSV/characteristics.csv'
DELIMITER ','
CSV HEADER;`

// characteristic_reviews

`CREATE TABLE IF NOT EXISTS characteristic_reviews (
  id SERIAL PRIMARY KEY,
  characteristic_id int,
  review_id int,
  value int
);`

// EC2: /tmp/dataDump/

`COPY characteristic_reviews(id, characteristic_id, review_id, value)
FROM '/tmp/dataDump/characteristic_reviews.csv'
DELIMITER ','
CSV HEADER;`

// local

`COPY characteristic_reviews(id, characteristic_id, review_id, value)
FROM '/Users/robertkelly/Dropbox/_Repos/_Immersive/_SDC/_oldCSV/characteristic_reviews.csv'
DELIMITER ','
CSV HEADER;`

`CREATE INDEX review_id_index_characterstics ON characteristic_reviews(review_id) INCLUDE (id, characteristic_id, review_id, value);`