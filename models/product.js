var product = {
  list: function (client, res) {
    client.query('SELECT * FROM products ORDER BY products.id', (req, data) => {
      // console.log(data.rows);
      res.render('home_customer', {
        data: data.rows,
        title: 'Top Products'
      });
    });
  }
};

module.exports = product;
