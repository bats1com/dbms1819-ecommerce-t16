const express = require('express');
const path = require('path');
const { Client } = require('pg');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const PORT = process.env.PORT || 5000; // test
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// const moment = require('moment-timezone');
// const hbs = require('nodemailer-express-handlebars');
// const url = require('url'); not used
// const cookieParser = require('cookie-parser');
// var flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
// const bcrypt = require('bcryptjs');

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
var role;

app.use(session({ secret: 'iem', resave: false, saveUninitialized: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
// Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

// require .js from other files
var Product = require('./models/product');
var Brand = require('./models/brand');
var Category = require('./models/category');
var Order = require('./models/order');
var Customer = require('./models/customer');
var Dashboard = require('./models/dashboard');

// login--------------------------------------------
passport.use(new Strategy({
  usernameField: 'email',
  passwordField: 'password'
},
function (email, password, cb) {
  Customer.getByEmail(client, email, function (user) {
    if (!user) { return cb(null, false); }
    return cb(null, user);
  });
})
);

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
  Customer.getById(client, id, function (user) {
    cb(null, user);
  });
});

function isAdmin (req, res, next) {
  if (req.isAuthenticated()) {
    Customer.getCustomerData(client, {id: req.user.id}, function (user) {
      role = user[0].user_type;
      console.log('role:', role);
      if (role === 'admin') {
        return next();
      } else {
        res.send('cannot access!');
      }
    });
  } else {
    res.redirect('/login');
  }
};

app.get('/login', function (req, res) {
  res.render('login', {
  });
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function (req, res) {
  // console.log('login data', req.body);
  // find customer by email
  // validate password saved in db to provided password
  Customer.getById(client, req.user.id, function (user) {
    role = user.user_type;
    req.session.user = user;
    console.log(req.session.user);
    console.log('role:', role);
    if (role === 'customer') {
      res.redirect('/');
    } else if (role === 'admin') {
      res.redirect('/admin');
    }
  });
});

app.get('/signup', function (req, res) {
  res.render('signup', {
  });
});

app.post('/signup', function (req, res) {
  console.log('signup data', req.body);
  client.query("INSERT INTO customers (first_name, last_name, email, street, municipality, province, zipcode, password, user_type) VALUES ('" + req.body.first_name + "', '" + req.body.last_name + "', '" + req.body.email + "', '" + req.body.street + "', '" + req.body.municipality + "', '" + req.body.province + "', '" + req.body.zipcode + "', '" + req.body.password + "', 'customer')")
    .then((results) => {
      res.redirect('/login');
    });
});

app.get('/', function (req, res) { // product list
  res.redirect('/page/1');
});

app.get('/page/:id', function (req, res) { // product list
  var page = parseInt(req.params.id);
  var totalItems;
  var totalPage;
  var prevPage;
  var nextPage;
  var lastPage;
  var pages = [];
  Product.getTotal(client, function (total) {
    totalItems = total[0].count;
    totalPage = totalItems / 10;
    for (var i = 1; i < totalPage + 1; i++) {
      pages[i - 1] = i;
      lastPage = i;
    };
    if (page === 1) {
      prevPage = 0;
      nextPage = 2;
    } else if (page > 1 && page < lastPage) {
      prevPage = page - 1;
      nextPage = page + 1;
    } else {
      prevPage = lastPage - 1;
      nextPage = 0;
    }
  });
  Product.list(client, {page}, function (products) {
    res.render('home_customer', {
      data: products,
      page: page,
      pages: pages,
      prevPage: prevPage,
      nextPage: nextPage,
      title: 'Top Products'
    });
  });
});

app.get('/admin', isAdmin, function (req, res) { // product list
  Dashboard.topTenCustomersWithMostOrders(client, function (topTenCustomersWithMostOrders) {
    Dashboard.topTenCustomersWithHighestPayment(client, function (topTenCustomersWithHighestPayment) {
      Dashboard.topTenMostOrderedProducts(client, function (topTenMostOrderedProducts) {
        Dashboard.topTenLeastOrderedProducts(client, function (topTenLeastOrderedProducts) {
          Dashboard.topThreeMostOrderedBrands(client, function (topThreeMostOrderedBrands) {
            Dashboard.topThreeMostOrderedCategories(client, function (topThreeMostOrderedCategories) {
              Dashboard.totalSalesInTheLastSevenDays(client, function (totalSalesInTheLastSevenDays) {
                Dashboard.totalSalesInTheLastThirtyDays(client, function (totalSalesInTheLastThirtyDays) {
                  Dashboard.dailyOrderCountForSevenDays(client, function (dailyOrderCountForSevenDays) {
                    res.render('dashboard', {
                      topTenCustomersWithMostOrders: topTenCustomersWithMostOrders,
                      topTenCustomersWithHighestPayment: topTenCustomersWithHighestPayment,
                      topTenMostOrderedProducts: topTenMostOrderedProducts,
                      topTenLeastOrderedProducts: topTenLeastOrderedProducts,
                      topThreeMostOrderedBrands: topThreeMostOrderedBrands,
                      topThreeMostOrderedCategories: topThreeMostOrderedCategories,
                      totalSalesInTheLastSevenDays: totalSalesInTheLastSevenDays,
                      totalSalesInTheLastThirtyDays: totalSalesInTheLastThirtyDays,
                      dailyOrderCountForSevenDays: dailyOrderCountForSevenDays,
                      title: 'Top Products',
                      layout: 'admin'
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

app.get('/admin/products/page/:id', isAdmin, function (req, res) { // product list
  var page = parseInt(req.params.id);
  var totalItems;
  var totalPage;
  var prevPage;
  var nextPage;
  var lastPage;
  var pages = [];
  Product.getTotal(client, function (total) {
    totalItems = total[0].count;
    totalPage = totalItems / 10;
    for (var i = 1; i < totalPage + 1; i++) {
      pages[i - 1] = i;
      lastPage = i;
    };
    if (page === 1) {
      prevPage = 0;
      nextPage = 2;
    } else if (page > 1 && page < lastPage) {
      prevPage = page - 1;
      nextPage = page + 1;
    } else {
      prevPage = lastPage - 1;
      nextPage = 0;
    }
  });
  Product.list(client, {page}, function (products) {
    res.render('home', {
      data: products,
      page: page,
      pages: pages,
      prevPage: prevPage,
      nextPage: nextPage,
      layout: 'admin',
      title: 'Top Products'
    });
  });
});

app.get('/products/:id', (req, res) => {
  var customer = false;
  var login = true;

  if (req.isAuthenticated()) {
    if (req.user.user_type === 'customer') {
      customer = true;
      login = false;
    }
  }
  if (login) {
    Product.getById(client, req.params.id, function (productData) {
      res.render('products_customer', {
        data: productData,
        productId: req.params.id,
        customer: customer,
        login: login
      });
    });
  } else {
    Product.getById(client, req.params.id, function (productData) {
      res.render('products_customer', {
        data: productData,
        productId: req.params.id,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        email: req.user.email,
        street: req.user.street,
        municipality: req.user.municipality,
        province: req.user.province,
        zipcode: req.user.zipcode,
        customer: customer,
        login: login
      });
    });
  }
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

app.get('/admin/products/:id', (req, res) => {
  Product.getById(client, req.params.id, function (productData) {
    res.render('products', {
      data: productData,
      layout: 'admin'
    });
  });
});

app.post('/admin/products', function (req, res) { // product list with insert new product
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
        action: '/admin/products/page/1'
      });
    } else {
      res.redirect('/admin/products/page/1');
    }
  });
});

app.get('/admin/products/update/:id', (req, res) => {
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
  // var orderDate = moment().tz('Asia/Manila').format('LLL'); // momentjs
  // var customersValues = [req.body.email, req.body.first_name, req.body.last_name, req.body.street, req.body.municipality, req.body.province, req.body.zipcode];
  // var ordersValues = [req.body.product_id, req.body.quantity, orderDate];
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

  // query with unique constraint
  client.query(`INSERT INTO customers (email, first_name, last_name, street, municipality, province, zipcode) VALUES ('${req.body.email}', '${req.body.first_name}', '${req.body.last_name}', '${req.body.street}','${req.body.municipality}', '${req.body.province}', '${req.body.zipcode}') ON CONFLICT (email) DO UPDATE SET first_name = '${req.body.first_name}', last_name = '${req.body.last_name}', street = '${req.body.street}', municipality = '${req.body.municipality}', province = '${req.body.province}', zipcode = '${req.body.zipcode}' WHERE customers.email ='${req.body.email}';`);
  client.query(`SELECT id FROM customers WHERE email = '${req.body.email}';`)
    .then((results) => {
      console.log(results);
      var customerId = results.rows[0].id;
      client.query(`INSERT INTO orders (customer_id, product_id, quantity) VALUES ('${customerId}', '${req.params.id}', '${req.body.quantity}');`)
        .then((results) => {
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
          res.redirect('/products/' + id + '/send');
        })
        .catch((err) => {
          console.log('error', err);
          res.send('Error sa e-mail');
        });
    })
    .catch((err) => {
      console.log('error', err);
      res.send('Error sa products send!');
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

app.get('/admin/customers/page/:id', (req, res) => { // MODULE 3 additions
  var page = parseInt(req.params.id);
  var totalItems;
  var totalPage;
  var prevPage;
  var nextPage;
  var lastPage;
  var pages = [];
  Customer.getTotal(client, function (total) {
    totalItems = total[0].count;
    totalPage = totalItems / 10;
    for (var i = 1; i < totalPage + 1; i++) {
      pages[i - 1] = i;
      lastPage = i;
    };
    if (page === 1) {
      prevPage = 0;
      nextPage = 2;
    } else if (page > 1 && page < lastPage) {
      prevPage = page - 1;
      nextPage = page + 1;
    } else {
      prevPage = lastPage - 1;
      nextPage = 0;
    }
  });
  Customer.list(client, {page}, function (customers) {
    res.render('customers', {
      data: customers,
      page: page,
      pages: pages,
      prevPage: prevPage,
      nextPage: nextPage,
      layout: 'admin'
    });
  });
});

app.get('/admin/customers/:id', (req, res) => {
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

app.get('/admin/orders/page/:id', (req, res) => { // ---------------------------
  var page = parseInt(req.params.id);
  var totalItems;
  var totalPage;
  var prevPage;
  var nextPage;
  var lastPage;
  var pages = [];
  Order.getTotal(client, function (total) {
    totalItems = total[0].count;
    console.log('aw');
    console.log(totalItems);
    totalPage = totalItems / 10;
    for (var i = 1; i < totalPage + 1; i++) {
      pages[i - 1] = i;
      lastPage = i;
    };
    if (page === 1) {
      prevPage = 0;
      nextPage = 2;
    } else if (page > 1 && page < lastPage) {
      prevPage = page - 1;
      nextPage = page + 1;
    } else {
      prevPage = lastPage - 1;
      nextPage = 0;
    }
    console.log('page', page);
    console.log('prevp', prevPage);
    console.log('next', nextPage);
  });

  Order.list(client, {page}, function (orders) {
    res.render('orders', {
      data: orders,
      page: page,
      pages: pages,
      prevPage: prevPage,
      nextPage: nextPage,
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
