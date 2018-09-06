var Customer = {

  getByEmail: function (client, email, callback) {

  },

  list: function (client, filter, callback) {
    const listQuery = `
      SELECT *
      FROM customers
      ORDER BY email
      LIMIT 10
      OFFSET ((${filter.page}-1)*10)
    `;
    client.query(listQuery, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  create: function (client, customerData, callback) {
    /*
    var error = 0;
    const insertQuery = `
    INSERT INTO brands(brand_name, brand_description)
    VALUES('${brandData.brand_name}', '${brandData.brand_description}')
    `;
    client.query(insertQuery)
    .then((result) =>{
      console.log('Inserted');
      callback(error);
    })
    .catch((err) => {
      console.log('error', err);
      error = 1;
      callback(error);
    });
    */
  }

};

module.exports = Customer;
