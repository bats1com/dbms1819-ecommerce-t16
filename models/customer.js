var Customer = {

  getById: function (client, id, callback) {
    const query = `
      SELECT * FROM customers WHERE id = '${id}'
    `;
    client.query(query, (req, data) => {
      callback(data.rows[0]);
    });
  },

  getByEmail: (client, email, callback) => {
    const query = `
      select * from customers where email = '${email}'
    `;
    client.query(query, (req, result) => {
      callback(result.rows[0]);
    });
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

  createCustomer: function (client, customerData, callback) {
    customerData = [customerData.email, customerData.fName, customerData.lName, customerData.street, customerData.mun, customerData.prov, customerData.zip, customerData.pass, customerData.userType];
    const query = `
      INSERT INTO customers (email, first_name, last_name, street, municipality, province, zipcode, password, user_type) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    client.query(query, customerData);
    // .then(res => callback('SUCCESS'))
    // .catch(e => callback('ERROR'))
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
  },

  getCustomerData: (client, id, callback) => {
    const query = `
      select * from customers where id = '${id.id}'
    `;
    client.query(query, (req, data) => {
      callback(data.rows);
    });
  },

  update: (client, customerId, customerData, callback) => {
    const query = `
      UPDATE
        customers
      SET
        email = '${customerData.email}', first_name = '${customerData.fName}', last_name = '${customerData.lName}', street = '${customerData.street}', municipality = '${customerData.mun}', province = '${customerData.prov}', zipcode = '${customerData.zip}', password = '${customerData.pass}'
      WHERE id = '${customerId.id}'
    `;
    client.query(query, (req, data) => {
    // console.log(data.rows)
      callback(data);
    });
  },

  getTotal: function (client, callback) {
    const query = `
      SELECT COUNT(*)
      FROM customers
    `;
    client.query(query, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  }

};

module.exports = Customer;
