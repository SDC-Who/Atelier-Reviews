// id,product_id,rating,date,summary,body,recommend,reported,reviewer_name,reviewer_email,response,helpfulness
// 0,   1,        2,       3,   4,    5,   6,          7,       8,           9,             10,       11

// 1. transform string from CSV into an array, correctly ordered

module.exports.createOrderedArrayFromString = string => {
  var orderedArray = [];
  var arrayFromString = string.split(',');

  var recommend = arrayFromString[6];
  if (recommend === 'true') {
    recommend = true;
  } else if (recommend === 'false') {
    recommend = false;
  } else {
    recommend = 'null';
  }

  var reported = arrayFromString[7];
  if (reported === 'true') {
    reported = true;
  } else if (reported === 'false') {
    reported = false;
  } else {
    reported = 'null';
  }

  orderedArray[0] = arrayFromString[0] !== '' ? Number(arrayFromString[0]) : 'null'; // id
  orderedArray[1] = arrayFromString[2] !== '' ? Number(arrayFromString[2]) : 'null'; // rating
  orderedArray[2] = arrayFromString[4] !== '' ? '\'' + arrayFromString[4].slice(1, -1) + '\'' : 'null'; // summary
  orderedArray[3] = recommend; // recommend
  orderedArray[4] = arrayFromString[10] !== '' ? arrayFromString[10] : 'null'; // response
  orderedArray[5] = reported; // reported
  orderedArray[6] = arrayFromString[5] !== '' ? '\'' + arrayFromString[5].slice(1, -1) + '\'' : 'null'; // body
  orderedArray[7] = arrayFromString[3] !== '' ? '\'' + arrayFromString[3].slice(1, -1) + '\''  : 'null'; // date
  orderedArray[8] = arrayFromString[8] !== '' ? '\'' + arrayFromString[8].slice(1, -1) + '\'' : 'null'; // reviewer_name
  orderedArray[9] = arrayFromString[9] !== '' ? '\'' + arrayFromString[9].slice(1, -1) + '\'' : 'null'; // email
  orderedArray[10] = arrayFromString[11] !== '' ? Number(arrayFromString[11]) : 'null'; // helpfulness
  orderedArray[12] = arrayFromString[1] !== '' ? Number(arrayFromString[1]) : 'null'; // product_id
  return orderedArray;
};

// 2. feed array into createReviewQuery (so you can get the string to query the database with)

module.exports.createReviewQuery = array => {
  return `
    INSERT INTO reviews (id, rating, summary, recommend, response, reported, body, date, reviewer_name, email, helpfulness, photos, product_id)
    VALUES (${array.join(', ')})
  `;
};