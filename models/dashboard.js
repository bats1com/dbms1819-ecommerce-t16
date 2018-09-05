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
    `;
    client.query(query, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  topTenCustomersWithHighestPayment: function (client, callback) {

  },

  topTenMostOrderedProducts: function (client, callback) {

  },

  topTenLeastOrderedPproducts: function (client, callback) {

  },

  topThreeMostOrderedBrands: function (client, callback) {

  },

  topThreeMostOrderedCategories: function (client, callback) {

  },

  totalSalesInTheLast: function (client, days, callback) {

  },

  dailyOrderCountForSevenDays: function (client, callback) {

  }

  // list: function (client, filter, callback) {
  //   const brandQuery = `
  //     SELECT *
  //     FROM brands
  //   `;
  //   client.query(brandQuery, (req, data) => {
  //     console.log(data.rows);
  //     callback(data.rows);
  //   });
  // }

};

module.exports = Dashboard;
