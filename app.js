const express = require('express');
const path = require('path');
const { Client } = require('pg');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const moment = require('moment');
const PORT = process.env.PORT || 5000; // test
// const url = require('url'); not used
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  database: 'ddmihcu0i9oh4g',
  user: 'wagrbiqjyejffc',
  password: '3352d8150a25ae9b72764c1ec8c20576e8bc0c9d64a07224a2d18db21af77846',
  host: 'ec2-54-204-23-228.compute-1.amazonaws.com',
  port: 5432,
  ssl: true
});
/*
const client = new Client({
  database: 'storedb',
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432
});
*/

client.connect()
  .then(function () {
    console.log('connected to database!');
  })
  .catch(function () {
    console.log('Error');
  });

// View engine setup
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
// Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// require .js from other files
var product = require('./models/product');

app.get('/', function (req, res) { // product list
  product.list(client, res);
  console.log(moment().format('LLLL [GMT+8]'));
  /*
  client.query('SELECT * FROM products ORDER BY products.id', (req, data) => {
    var list = [];
    for (var i = 0; i < data.rows.length; i++) {
      list.push(data.rows[i]);
    }
  });
  */
});

app.get('/products/:id', (req, res) => {
  var id = parseInt(req.params.id);
  client.query(`SELECT products.id, products.product_name, products.product_description, products.tagline, products.price, products.warranty, products.pic, products.category_id, products_category.category_name, products.brand_id, brands.brand_name FROM products INNER JOIN products_category ON products.category_id = products_category.id INNER JOIN brands ON products.brand_id = brands.id  WHERE products.id=${id}`, (req, data) => {
    // console.log(data);
    res.render('products_customer', {
      data: data.rows
    });
  });
});

// create equivalen qpp.get route--------------------------------------------------
app.post('/products/:id/send', function (req, res) {
  console.log(req.body);
  var id = parseInt(req.params.id);
  var email = req.body.email;
  var orderDate = moment().format('LLLL [GMT+8]'); // momentjs
  var customersValues = [req.body.email, req.body.first_name, req.body.last_name, req.body.street, req.body.municipality, req.body.province, req.body.zipcode];
  var ordersValues = [req.body.product_id, req.body.quantity, orderDate];
  const output1 = `
    <p>Your Order Request has been received!</p>
    <h3>Order Details</h3>
    <ul>
      <li>Customer Name: ${req.body.first_name} ${req.body.last_name}</li>
      <li>Email: ${req.body.email}</li>
      <li>Address: ${req.body.street} ${req.body.municipality} ${req.body.province} ${req.body.zipcode}</li>
      <li>Product ID: ${req.body.product_id}</li>
      <li>Quantity: ${req.body.quantity}</li>
    </ul>
  `;
  const output2 = `
    <p>You have a new Order Request!</p>
    <h3>Order Details</h3>
    <ul>
      <li>Customer Name: ${req.body.first_name} ${req.body.last_name}</li>
      <li>Email: ${req.body.email}</li>
      <li>Address: ${req.body.street} ${req.body.municipality} ${req.body.province} ${req.body.zipcode}</li>
      <li>Product ID: ${req.body.product_id}</li>
      <li>Quantity: ${req.body.quantity}</li>
    </ul>
  `;

  client.query('SELECT email FROM customers', (req, data) => {
    var list;
    var exist = 0;
    console.log(email);
    for (var i = 0; i < data.rows.length; i++) {
      list = data.rows[i].email;
      if (list === email) {
        exist = 1;
      }
    }

    if (exist === 1) {
      console.log('email exists');
      // '/products/:id'
      client.query('SELECT id FROM customers WHERE email=$1', [email], (err, data) => {
        if (err) {
          console.log(err.stack);
        } else {
          ordersValues[3] = data.rows[0].id;
          // console.log(ordersValues + '<====');
          client.query('INSERT INTO orders(product_id, quantity, order_date, customer_id) VALUES($1, $2, $3, $4)', ordersValues, (req, data) => {
            // nodemailer
            let transporter = nodemailer.createTransport({
              host: 'smtp.mail.yahoo.com',
              port: 465,
              secure: true,
              auth: {
                user: 'iemaniamailer@yahoo.com',
                pass: 'custominearmonitor'
              }
            });

            let mailOptions1 = {
              from: '"IEMania Mailer" <iemaniamailer@yahoo.com',
              to: email,
              subject: 'IEMania Order Request Acknowledgement',
              html: output1
            };

            let mailOptions2 = {
              from: '"IEMania Mailer" <iemaniamailer@yahoo.com>',
              to: 'jdvista96@gmail.com, drobscortz@gmail.com',
              subject: 'IEMania Order Request',
              html: output2
            };

            transporter.sendMail(mailOptions1, (error, info) => {
              if (error) {
                return console.log(error);
              }
              console.log('Message sent: %s', info.messageId);
              console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            });

            transporter.sendMail(mailOptions2, (error, info) => {
              if (error) {
                return console.log(error);
              }
              console.log('Message sent: %s', info.messageId);
              console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            });
          });
          res.redirect('/products/' + id + '/send'); // ---change this
        }
      });
    } else {
      console.log('not exist');
      console.log(customersValues);
      client.query('INSERT INTO customers(email, first_name, last_name, street, municipality, province, zipcode) VALUES($1, $2, $3, $4, $5, $6, $7)', customersValues, (err, data) => {
        if (err) {
          console.log(err.stack);
        } else {
          client.query('SELECT lastval()', (err, data) => {
            if (err) {
              console.log(err.stack);
            } else {
              ordersValues[3] = data.rows[0].lastval;
              client.query('INSERT INTO orders(product_id, quantity, order_date, customer_id) VALUES($1, $2, $3, $4)', ordersValues, (req, data) => {
                // nodemailer
                let transporter = nodemailer.createTransport({
                  host: 'smtp.mail.yahoo.com',
                  port: 465,
                  secure: true,
                  auth: {
                    user: 'iemaniamailer@yahoo.com',
                    pass: 'custominearmonitor'
                  }
                });

                let mailOptions1 = {
                  from: '"IEMania Mailer" <iemaniamailer@yahoo.com',
                  to: email,
                  subject: 'IEMania Order Request Acknowledgement',
                  html: output1
                };

                let mailOptions2 = {
                  from: '"IEMania Mailer" <iemaniamailer@yahoo.com>',
                  to: 'jdvista96@gmail.com, drobscortz@gmail.com',
                  subject: 'IEMania Order Request',
                  html: output2
                };

                transporter.sendMail(mailOptions1, (error, info) => {
                  if (error) {
                    return console.log(error);
                  }
                  console.log('Message sent: %s', info.messageId);
                  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                });

                transporter.sendMail(mailOptions2, (error, info) => {
                  if (error) {
                    return console.log(error);
                  }
                  console.log('Message sent: %s', info.messageId);
                  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                });
              });
              res.redirect('/products/' + id + '/send'); // ---change this
            }
          });
        }
      });
    }
  });
});

app.get('/products/:id/send', function (req, res) {
  var id = parseInt(req.params.id);
  res.render('email', {
    message: 'Email Sent!',
    PID: id
  });
});

app.get('/member/1', function (req, res) {
  res.render('member', {
    name: 'Jomar Vista',
    email: 'jdvista96@gmail.com',
    phone: '09423454782',
    imageurl: '/jomar.jpg',
    hobbies: ['Listening to music', 'Playing computer games']
  });
});

app.get('/member/2', function (req, res) {
  res.render('member', {
    name: 'Daniel Cortez',
    email: 'drobscortz@gmail.com',
    phone: '09971960972',
    imageurl: '/daniel.jpg',
    hobbies: ['Playing computer games', 'Watching youtube videos']
  });
});

app.get('/brands', (req, res) => { // brand list
  client.query('SELECT * FROM brands', (req, data) => {
    res.render('brands_customer', {
      data: data.rows
    });
  });
});

app.get('/categories', (req, res) => { // category list
  client.query('SELECT * FROM products_category', (req, data) => {
    res.render('categories_customer', {
      data: data.rows
    });
  });
});

// -----------------------------ALL ADMIN ROUTES----------------------------------------------------------------------------------------
app.get('/admin', function (req, res) { // product list
  client.query('SELECT * FROM products ORDER BY products.id', (req, data) => {
    res.render('home', {
      data: data.rows,
      title: 'Product List',
      layout: 'admin'
    });
  });
});

app.post('/admin', function (req, res) { // product list with insert new product
  var values = [];
  var productName;
  productName = req.body.product_name;
  values = [req.body.product_name, req.body.product_description, req.body.tagline, req.body.price, req.body.warranty, req.body.pic, req.body.category_id, req.body.brand_id];
  client.query('SELECT product_name FROM products', (req, data) => {
    var list;
    var exist = 0;
    for (var i = 0; i < data.rows.length; i++) {
      list = data.rows[i].product_name;
      if (list === productName) {
        exist = 1;
      }
    }
    if (exist === 1) {
      res.render('duplicate', {
        layout: 'admin',
        name: 'Products',
        message: 'Product already exists',
        action: '/admin'
      });
    } else {
      client.query('INSERT INTO products(product_name, product_description, tagline, price, warranty, pic, category_id, brand_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8)', values, (err, data) => {
        if (err) {
          console.log(err.stack);
        } else {
          console.log(data.rows[0]);
        }
      });
      res.redirect('/admin');
    }
  });
});

app.get('/admin/product/create', (req, res) => { // CREATE PRODUCT html
  client.query('SELECT * FROM products_category', (req, data) => {
    console.log(data.rows);
    client.query('SELECT * FROM brands', (req, data2) => {
      res.render('product_create', {
        data: data.rows,
        data2: data2.rows,
        layout: 'admin'
      });
    });
  });
});

app.get('/admin/products/:id', (req, res) => {
  var id = parseInt(req.params.id);
  client.query(`SELECT products.id, products.product_name, products.product_description, products.tagline, products.price, products.warranty, products.pic, products.category_id, products_category.category_name, products.brand_id, brands.brand_name FROM products INNER JOIN products_category ON products.category_id = products_category.id INNER JOIN brands ON products.brand_id = brands.id  WHERE products.id=${id}`, (req, data) => {
    console.log(data);
    res.render('products', {
      data: data.rows,
      layout: 'admin'
    });
  });
});

app.get('/admin/product/update/:id', (req, res) => {
  var id = parseInt(req.params.id);
  client.query(`SELECT products.id, products.product_name, products.product_description, products.tagline, products.price, products.warranty, products.pic, products.category_id, products_category.category_name, products.brand_id, brands.brand_name FROM products INNER JOIN products_category ON products.category_id = products_category.id INNER JOIN brands ON products.brand_id = brands.id WHERE products.id = ${id}`, (req, data) => {
    client.query('SELECT * FROM products_category', (req, data2) => {
      client.query('SELECT * FROM brands', (req, data3) => {
        res.render('product_update', {
          products: data.rows,
          products_category: data2.rows,
          brands: data3.rows,
          layout: 'admin'
        });
      });
    });
  });
});

app.post('/admin/products/:id', function (req, res) {
  console.log(req.body);
  var id = parseInt(req.params.id);
  var values = [];
  values = [req.body.id, req.body.product_name, req.body.product_description, req.body.tagline, req.body.price, req.body.warranty, req.body.pic, req.body.category_id, req.body.brand_id];
  client.query('UPDATE products SET product_name = $2, product_description = $3, tagline = $4, price = $5, warranty = $6, pic = $7, category_id = $8, brand_id = $9 WHERE id = $1', values);
  res.redirect('/admin/products/' + id);
});

// products ^
app.post('/admin/brands', function (req, res) { // brand list insert
  var values = [];
  var brandName;
  brandName = req.body.brand_name;
  values = [req.body.brand_name, req.body.brand_description];
  console.log(req.body);
  console.log(values);
  client.query('SELECT brand_name FROM brands', (req, data) => {
    var list;
    var exist = 0;
    for (var i = 0; i < data.rows.length; i++) {
      list = data.rows[i].brand_name;
      console.log(list);
      if (list === brandName) {
        exist = 1;
      }
    }
    if (exist === 1) {
      res.render('duplicate', {// temporary html
        layout: 'admin',
        name: 'Brands',
        message: 'Brand already exists',
        action: '/admin/brands'
      });
    } else {
      client.query('INSERT INTO brands(brand_name, brand_description) VALUES($1, $2)', values, (err, data) => {
        if (err) {
          console.log(err.stack);
        } else {
          console.log(data.rows[0]);
        }
      });
      res.redirect('/admin/brands');
    }
  });
});

app.get('/admin/brands', (req, res) => { // brand list
  client.query('SELECT * FROM brands', (req, data) => {
    res.render('brands', {
      data: data.rows,
      layout: 'admin'
    });
  });
});

app.get('/admin/brand/create', (req, res) => { // route to create brand html
  res.render('brand_create', {
    layout: 'admin'
  });
});

app.post('/admin/categories', function (req, res) { // category list with insert new category query
  var values = [];
  values = req.body.category_name;
  console.log(req.body);
  console.log(values);
  client.query('SELECT category_name FROM products_category', (req, data) => {
    var list;
    var exist = 0;
    console.log(values);
    console.log('aw');
    for (var i = 0; i < data.rows.length; i++) {
      list = data.rows[i].category_name;
      console.log(list);
      if (list === values) {
        exist = 1;
      }
    }
    if (exist === 1) {
      res.render('duplicate', {// temporary html
        layout: 'admin',
        name: 'Categories',
        message: 'Category already exists',
        action: '/admin/categories'
      });
    } else {
      client.query(`INSERT INTO products_category(category_name) VALUES('${values}')`, (err, data) => {
        if (err) {
          console.log(err.stack);
        } else {
          console.log(data.rows[0]);
        }
      });
      res.redirect('/admin/categories');
    }
  });
});

app.get('/admin/categories', (req, res) => { // category list
  client.query('SELECT * FROM products_category', (req, data) => {
    res.render('categories', {
      data: data.rows,
      layout: 'admin'
    });
  });
});

app.get('/admin/category/create', (req, res) => { // route to create category
  res.render('category_create', {
    layout: 'admin'
  });
});

app.get('/admin/customers', (req, res) => { // MODULE 3 additions
  client.query('SELECT * FROM customers', (req, data) => {
    res.render('customers', {
      data: data.rows,
      layout: 'admin'
    });
  });
});

app.get('/admin/customers/:id', (req, res) => {
  var id = parseInt(req.params.id);
  client.query('SELECT orders.id, orders.customer_id, orders.product_id, orders.order_date, orders.quantity, customers.email, customers.first_name, customers.last_name, customers.street, customers.municipality, customers.province, customers.zipcode, products.product_name FROM orders INNER JOIN customers ON orders.customer_id = customers.id INNER JOIN products ON orders.product_id = products.id WHERE orders.customer_id = $1', [id], (err, data) => {
    if (err) {
      console.log(err);
    } else {
      var list = [];
      console.log(data.rows);
      for (var i = 1; i < data.rows.length + 1; i++) {
        list.push(data.rows[i - 1]);
      }
      res.render('customer_details', {
        data: data.rows,
        layout: 'admin',
        first_name: list[0].first_name,
        last_name: list[0].last_name,
        customer_id: list[0].customer_id,
        email: list[0].email,
        street: list[0].street,
        municipality: list[0].municipality,
        province: list[0].province,
        zipcode: list[0].zipcode
      });
    }
  });
});

app.get('/admin/orders', (req, res) => {
  client.query('SELECT * FROM orders', (req, data) => {
    res.render('orders', {
      data: data.rows,
      layout: 'admin'
    });
  });
});

app.listen(3000, function () {
  console.log('Server started at port 3000');
});

app.listen(PORT);
