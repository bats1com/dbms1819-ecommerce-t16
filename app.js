const express = require('express');
const path = require('path');
const { Client } = require('pg');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
// const hbs = require('nodemailer-express-handlebars');
const moment = require('moment-timezone');
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
var Product = require('./models/product');
var Brand = require('./models/brand');
var Category = require('./models/category');
var Order = require('./models/order');
var Customer = require('./models/customer');

app.get('/', function (req, res) { // product list
  Product.list(client, {}, function (products) {
    res.render('home_customer', {
      data: products,
      title: 'Top Products'
    });
  });
});

app.get('/admin', function (req, res) { // product list
  Product.list(client, {}, function (products) {
    res.render('home', {
      data: products,
      title: 'Product List',
      layout: 'admin'
    });
  });
});

app.get('/products/:id', (req, res) => {
  Product.getById(client, req.params.id, function (productData) {
    res.render('products_customer', {
      data: productData
    });
  });
});

app.get('/admin/products/:id', (req, res) => {
  Product.getById(client, req.params.id, function (productData) {
    res.render('products', {
      data: productData,
      layout: 'admin'
    });
  });
});

app.get('/admin/product/create', (req, res) => { // CREATE PRODUCT html
  Category.list(client, {}, function (categories) {
    Brand.list(client, {}, function (brands) {
      res.render('product_create', {
        data: categories,
        data2: brands,
        layout: 'admin'
      });
    });
  });
});

app.post('/admin', function (req, res) { // product list with insert new product
  var productData = {
    product_name: req.body.product_name,
    product_description: req.body.product_description,
    tagline: req.body.tagline,
    price: req.body.price,
    warranty: req.body.warranty,
    pic: req.body.pic,
    category_id: req.body.category_id,
    brand_id: req.body.brand_id
  };

  Product.create(client, productData, function (error) {
    if (error === 1) {
      res.render('duplicate', {
        layout: 'admin',
        name: 'Products',
        message: 'Product already exists',
        action: '/admin'
      });
    } else {
      res.redirect('/admin');
    }
  });
});

app.get('/admin/product/update/:id', (req, res) => {
  Product.getById(client, req.params.id, function (products) {
    Category.list(client, {}, function (categories) {
      Brand.list(client, {}, function (brands) {
        res.render('product_update', {
          products: products,
          products_category: categories,
          brands: brands,
          layout: 'admin'
        });
      });
    });
  });
});

app.post('/admin/products/:id', function (req, res) {
  console.log(req.body);
  var id = parseInt(req.params.id);
  var productData = {
    id: req.body.id,
    product_name: req.body.product_name,
    product_description: req.body.product_description,
    tagline: req.body.tagline,
    price: req.body.price,
    warranty: req.body.warranty,
    pic: req.body.pic,
    category_id: req.body.category_id,
    brand_id: req.body.brand_id
  };

  Product.update(client, productData, function (error) {
    console.log(error);
    res.redirect('/admin/products/' + id);
  });
});

// create equivalen qpp.get route--------------------------------------------------
app.post('/products/:id/send', function (req, res) {
  console.log(req.body);
  var id = parseInt(req.params.id);
  var email = req.body.email;
  var orderDate = moment().tz('Asia/Manila').format('LLL'); // momentjs
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

app.get('/brands', (req, res) => { // brand list
  Brand.list(client, {}, function (brands) {
    res.render('brands_customer', {
      data: brands
    });
  });
});

app.get('/admin/brands', (req, res) => { // brand list
  Brand.list(client, {}, function (brands) {
    res.render('brands', {
      data: brands,
      layout: 'admin'
    });
  });
});

app.get('/admin/brand/create', (req, res) => { // route to create brand html
  res.render('brand_create', {
    layout: 'admin'
  });
});

app.post('/admin/brands', function (req, res) { // brand list insert
  var brandData = {
    brand_name: req.body.brand_name,
    brand_description: req.body.brand_description
  };
  Brand.create(client, brandData, function (error) {
    if (error === 1) {
      res.render('duplicate', {// temporary html
        layout: 'admin',
        name: 'Brands',
        message: 'Brand already exists',
        action: '/admin/brands'
      });
    } else {
      res.redirect('/admin/brands');
    }
  });
});

app.get('/categories', (req, res) => { // category list
  Category.list(client, {}, function (categories) {
    res.render('categories_customer', {
      data: categories
    });
  });
});

app.get('/admin/categories', (req, res) => { // category list
  Category.list(client, {}, function (categories) {
    res.render('categories', {
      data: categories,
      layout: 'admin'
    });
  });
});

app.get('/admin/category/create', (req, res) => { // route to create category
  res.render('category_create', {
    layout: 'admin'
  });
});

app.post('/admin/categories', function (req, res) { // category list with insert new category query
  Category.create(client, req.body.category_name, function (error) {
    if (error === 1) {
      res.render('duplicate', {
        layout: 'admin',
        name: 'Categories',
        message: 'Category already exists',
        action: '/admin/categories'
      });
    } else {
      res.redirect('/admin/categories');
    }
  });
});

app.get('/admin/customers', (req, res) => { // MODULE 3 additions
  Customer.list(client, function (customers) {
    res.render('customers', {
      data: customers,
      layout: 'admin'
    });
  });
});

app.get('/admin/customers/:id', (req, res) => {
  /*
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
      // res.render
    }
  });
  */
  Order.listByCustomerId(client, req.params.id, function (orderData) {
    res.render('customer_details', {
      data: orderData,
      layout: 'admin',
      first_name: orderData[0].first_name,
      last_name: orderData[0].last_name,
      customer_id: orderData[0].customer_id,
      email: orderData[0].email,
      street: orderData[0].street,
      municipality: orderData[0].municipality,
      province: orderData[0].province,
      zipcode: orderData[0].zipcode
    });
  });
});

app.get('/admin/orders', (req, res) => {
  Order.list(client, {}, function (orders) {
    res.render('orders', {
      data: orders,
      layout: 'admin'
    });
  });
});

// MEMBERS
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

app.listen(3000, function () {
  console.log('Server started at port 3000');
});

app.listen(PORT);
