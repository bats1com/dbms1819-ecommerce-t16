var Order = {

  list: function (client, filter, callback) {
    const listQuery = `
      SELECT *
      FROM orders
    `;
    client.query(listQuery, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  listByCustomerId: function (client, customerId, callback) {
    const listByCustomerIdQuery = `
      SELECT 
        orders.id, 
        orders.customer_id, 
        orders.product_id, 
        orders.order_date, 
        orders.quantity, 
        customers.email, 
        customers.first_name, 
        customers.last_name, 
        customers.street, 
        customers.municipality, 
        customers.province, 
        customers.zipcode, 
        products.product_name 
      FROM 
        orders 
      INNER JOIN 
        customers 
      ON 
        orders.customer_id = customers.id 
      INNER JOIN 
        products 
      ON 
        orders.product_id = products.id 
      WHERE 
        orders.customer_id = ${customerId}
    `;
    client.query(listByCustomerIdQuery, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  create: function (client, orderData, callback) {
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

module.exports = Order;
