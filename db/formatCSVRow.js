module.exports.formatReviewRow = obj => {
  // console.log(obj);
  if (!(obj.recommend === 'true' || obj.recommend === 'false')) {
    obj.recommend = 'null';
  }

  if (!(obj.reported === 'true' || obj.reported === 'false')) {
    obj.reported = 'null';
  }

  // escape apostrophes if apostrophes there be (summary, body, response)
  if (obj.summary.indexOf("'") !== -1) {
    // split the string by the apostrophe, and join it back together by two of 'em
    obj.summary = obj.summary.split("'").join("''");
  }
  if (obj.body.indexOf("'") !== -1) {
    // split the string by the apostrophe, and join it back together by two of 'em
    obj.body = obj.body.split("'").join("''");
  }
  if (obj.response.indexOf("'") !== -1) {
    // split the string by the apostrophe, and join it back together by two of 'em
    obj.response = obj.response.split("'").join("''");
  }

  var resultArray = [];
  resultArray.push(obj.id, obj.product_id, obj.rating, '\'' + obj.date + '\'', '\'' + obj.summary + '\'', '\'' + obj.body + '\'', obj.recommend, obj.reported, '\'' + obj.reviewer_name + '\'', '\'' + obj.reviewer_email + '\'', '\'' + obj.response + '\'', obj.helpfulness, '\'' + obj.photos + '\'');
  // console.log('resultArray:', resultArray);

  return resultArray;
};

// var reviewQuery = `INSERT INTO reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness, photos) VALUES (${row.id}, ${row.product_id}, ${row.rating}, ${'\'' + row.date + '\''}, ${'\'' + row.summary + '\''}, ${'\'' + row.body + '\''}, ${row.recommend}, ${row.reported}, ${'\'' + row.reviewer_name + '\''}, ${'\'' + row.reviewer_email + '\''}, ${'\'' + row.response + '\''}, ${row.helpfulness}, ${'\'' + row.photos + '\''});`;