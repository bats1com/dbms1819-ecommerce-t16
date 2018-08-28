var Category = {

  list: function (client, filter, callback) {
    const categoryQuery = `
      SELECT * 
      FROM products_category
    `;
    client.query(categoryQuery, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  create: function (client, categoryData, callback) {
    var error = 0;
    const insertQuery = `
    INSERT INTO products_category(category_name) 
    VALUES('${categoryData}')
    `;
    client.query(insertQuery)
      .then((result) => {
        console.log('Inserted');
        callback(error);
      })
      .catch((err) => {
        console.log('error', err);
        error = 1;
        callback(error);
      });
  }

};

module.exports = Category;
