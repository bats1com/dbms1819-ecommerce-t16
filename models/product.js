var Product = {

  list: function (client, filter, callback) {
    console.log(filter.page);
    const productListQuery = `
      SELECT * 
      FROM products 
      ORDER BY products.id
      LIMIT 10
      OFFSET ((${filter.page}-1)*10)
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

  create: function (client, productData, callback) {
    var error = 0;
    console.log(productData);
    const insertQuery = `
    INSERT INTO products(product_name, product_description, tagline, price, warranty, pic, category_id, brand_id) 
    VALUES('${productData.product_name}', '${productData.product_description}', '${productData.tagline}', '${productData.price}', '${productData.warranty}', '${productData.pic}', '${productData.category_id}', '${productData.brand_id}')
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
  },

  update: function (client, productData, callback) {
    var error = 0;
    const updateQuery = `
    UPDATE 
      products 
    SET 
      product_name = '${productData.product_name}', 
      product_description = '${productData.product_description}', 
      tagline = '${productData.tagline}', 
      price = '${productData.price}', 
      warranty = '${productData.warranty}', 
      pic = '${productData.pic}', 
      category_id = '${productData.category_id}', 
      brand_id = '${productData.brand_id}' 
    WHERE 
      id = ${productData.id}
    `;
    client.query(updateQuery)
      .then((result) => {
        console.log('Updated');
        callback(error);
      })
      .catch((err) => {
        console.log('error', err);
        error = 1;
        callback(error);
      });
  },

  getTotal: function (client, callback) {
    const query = `
      SELECT COUNT(*)
      FROM products
    `;
    client.query(query, (req, data) => {
      console.log(data.rows);
      callback(data.rows);
    });
  }

};

module.exports = Product;
