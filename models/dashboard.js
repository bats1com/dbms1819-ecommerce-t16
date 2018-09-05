var Dashboard = {

  topTenCustomersWithMostOrders: function (client, callback) {
    const query = `
      SELECT 
        customers.first_name AS first_name,
        customers.last_name AS last_name,
        customers.email AS email,
        COUNT(orders.id) AS number_of_orders
      FROM customers
      INNER JOIN orders
      ON customers.id = orders.customer_id
      GROUP BY 
        customers.first_name, 
        customers.last_name,
        customers.email
      ORDER BY COUNT(orders.id) DESC
      LIMIT 10
    `;
    client.query(query, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  topTenCustomersWithHighestPayment: function (client, callback) {

  },

  topTenMostOrderedProducts: function (client, callback) {
    const query = `
      SELECT
        products.product_name AS product_name,
        COUNT(product_id) AS number_of_orders
      FROM orders
      INNER JOIN products
      ON products.id = orders.product_id
      GROUP BY
        product_id,
        products.product_name
      ORDER BY 
        number_of_orders DESC,
        product_name ASC
      LIMIT 10
    `;
    client.query(query, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  topTenLeastOrderedProducts: function (client, callback) {
    const query = `
      SELECT
        products.product_name AS product_name,
        COUNT(product_id) AS number_of_orders
      FROM orders
      INNER JOIN products
      ON products.id = orders.product_id
      GROUP BY
        product_id,
        products.product_name
      ORDER BY 
        number_of_orders ASC,
        product_name ASC
      LIMIT 10
    `;
    client.query(query, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  topThreeMostOrderedBrands: function (client, callback) {
    const query = `
      SELECT
        brands.brand_name AS brand_name,
        COUNT(product_id) AS number_of_orders
      FROM orders
      INNER JOIN products
      ON products.id = orders.product_id
      INNER JOIN brands
      ON brands.id = products.brand_id
      GROUP BY
        brands.id
      ORDER BY 
        number_of_orders DESC,
        brand_name ASC
      LIMIT 3
    `;
    client.query(query, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  topThreeMostOrderedCategories: function (client, callback) {
    const query = `
      SELECT
        products_category.category_name AS category_name,
        COUNT(product_id) AS number_of_orders
      FROM orders
      INNER JOIN products
      ON products.id = orders.product_id
      INNER JOIN products_category
      ON products_category.id = products.category_id
      GROUP BY
        products_category.id
      ORDER BY 
        number_of_orders DESC,
        category_name ASC
      LIMIT 3
    `;
    client.query(query, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  totalSalesInTheLast: function (client, days, callback) {

  },

  dailyOrderCountForSevenDays: function (client, callback) {

  }

};

module.exports = Dashboard;
