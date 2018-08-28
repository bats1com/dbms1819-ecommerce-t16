var Product = {

  list: function (client, filter, callback) {
    const productListQuery = `
      SELECT * 
      FROM products 
      ORDER BY products.id
    `;
    client.query(productListQuery, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  getById: function (client, productId, callback) {
    const productQuery = `
    SELECT 
      products.id, 
      products.product_name, 
      products.product_description, 
      products.tagline, products.price, 
      products.warranty, 
      products.pic, 
      products.category_id, 
      products_category.category_name, 
      products.brand_id, 
      brands.brand_name 
    FROM products 
    INNER JOIN products_category 
    ON products.category_id = products_category.id 
    INNER JOIN brands 
    ON products.brand_id = brands.id  
    WHERE products.id=${productId}
    `;
    client.query(productQuery, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  },

  createView: function (client, callback) {
    client.query('SELECT * FROM products_category', (req, data) => {
      client.query('SELECT * FROM brands', (req, data2) => {
        var product = {
          category: data.rows,
          brand: data2.rows
        };
        callback(product);
      });
    });
  }

};

module.exports = Product;
