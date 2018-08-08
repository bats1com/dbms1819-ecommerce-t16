const express = require('express');
const path = require('path');
const { Client } = require('pg');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const PORT = process.env.PORT || 5000
const url = require('url');

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
	.then(function() {
		console.log('connected to database!');
	})
	.catch(function() {
		console.log('Error');
	})

//View engine setup
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
//Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', function(req,res) { //product list
	client.query('SELECT * FROM products ORDER BY products.id', (req, data)=>{
		var list = [];
		for (var i = 0; i < data.rows.length; i++) {
			list.push(data.rows[i]);
		}
		res.render('home',{
			data: list,
			title: 'Top Products'
		});
	});
});

app.get('/product/create', (req,res)=>{	//CREATE PRODUCT html
	client.query('SELECT * FROM products_category', (req, data)=>{
		var list = [];
		for (var i = 1; i < data.rows.length+1; i++) {
				list.push(data.rows[i-1]);
		}
		client.query('SELECT * FROM brands', (req, data)=>{
			var list2 = [];
			for (var i = 1; i < data.rows.length+1; i++) {
					list2.push(data.rows[i-1]);
			}
			res.render('product_create',{
				data: list,
				data2: list2
			});
		});
	});
});

app.post('/', function(req,res) { //product list with insert new product
	var values =[];
	values = [req.body.product_name,req.body.product_description,req.body.tagline,req.body.price,req.body.warranty,req.body.pic,req.body.category_id,req.body.brand_id];
	//console.log(req.body);
	//console.log(values);
	client.query("INSERT INTO products(product_name, product_description, tagline, price, warranty, pic, category_id, brand_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8)", values, (err, res)=>{
		if (err) {
			console.log(err.stack)
			}
		else {
			console.log(res.rows[0])
		}
	});
	res.redirect('/');
	/*
	client.query('SELECT * FROM products ORDER BY products.id', (req, data)=>{
		var list = [];
		for (var i = 0; i < data.rows.length; i++) {
			list.push(data.rows[i]);
		}
		res.render('home',{
			data: list,
			title: 'Top Products'
		});
	});
	*/
});

app.get('/products/:id', (req,res)=>{
	var id = req.params.id;
	client.query('SELECT products.id, products.product_name, products.product_description, products.tagline, products.price, products.warranty, products.pic, products.category_id, products_category.category_name, products.brand_id, brands.brand_name FROM products INNER JOIN products_category ON products.category_id = products_category.id INNER JOIN brands ON products.brand_id = brands.id ORDER BY products.id' , (req, data)=>{
		var list = [];
		//console.log(data);
		for (var i = 0; i < data.rows.length+1; i++) {
			if (i==id) {
				list.push(data.rows[i-1]);
			}
		}
		//console.log(list);
		res.render('products',{
			data: list
		});
	});
});
// create equivalen qpp.get route--------------------------------------------------
app.post('/products/:id/send', function(req, res) {
	console.log(req.body);
	var id = req.params.id;
	var email =req.body.email;
	var customers_values = [req.body.email,req.body.first_name,req.body.last_name,req.body.street,req.body.municipality,req.body.province,req.body.zipcode];
	var orders_values = [req.body.product_id, req.body.quantity];
	const output1 = `
		<p>Your Order Request has been received!</p>
	`;
	const output2 = `
		<p>You have a new Order Request!</p>
		<h3>Order Details</h3>
		<ul>
			<li>Customer Name: ${req.body.first_name} $(req.body.last_name}</li>
			<li>Email: ${req.body.email}</li>
			<li>Address: ${req.body.street} ${req.body.municipality} ${req.body.province} ${req.body.zipcode}</li>
			<li>Product ID: ${req.body.product_id}</li>
			<li>Quantity: ${req.body.quantity}</li>
		</ul>
	`;

	client.query('SELECT email FROM customers', (req,data)=> {
		var list;
		var exist = 0;
		console.log(email);
		console.log("aw");
		for (var i = 0; i < data.rows.length; i++) {
			list = data.rows[i].email;
			//JSON.stringify(list);
			console.log(list);
			if (list==email) {
				exist=1;
			}
		}

		if (exist==1) {
			console.log("email exists");
			//'/products/:id'
			client.query('SELECT products.id, products.product_name, products.product_description, products.tagline, products.price, products.warranty, products.pic, products.category_id, products_category.category_name, products.brand_id, brands.brand_name FROM products INNER JOIN products_category ON products.category_id = products_category.id INNER JOIN brands ON products.brand_id = brands.id ORDER BY products.id' , (req, data)=>{
				var list = [];
				//console.log(data);
				for (var i = 0; i < data.rows.length+1; i++) {
					if (i==id) {
						list.push(data.rows[i-1]);
					}
				}
				//console.log(list);
				//res.redirect('/products/'+id);
				res.redirect('/products/'+id+'/email-exists');
			});
		}
		else {
			console.log("not exist");
			console.log(customers_values);
			client.query('INSERT INTO customers(email, first_name, last_name, street, municipality, province, zipcode) VALUES($1, $2, $3, $4, $5, $6, $7)', customers_values, (err,res)=> {
				if (err) {
					console.log(err.stack)
				}
				else {
					client.query('SELECT lastval()', (err,data)=> {
						if (err) {
							console.log(err.stack)
						}
						else {
							console.log(data.rows);
							console.log("got customer id");
							orders_values[2] = data.rows[0].lastval;
							console.log(orders_values+"<====")
							client.query('INSERT INTO orders(product_id, quantity, customer_id) VALUES($1, $2, $3)', orders_values, (req,res)=> {
								//nodemailer
								let transporter = nodemailer.createTransport({
							      	host: 'smtp.mail.yahoo.com',
							        port: 465,
							        secure: true,
							        auth: {
							            user: 'iemaniamailer@yahoo.com', 
							            pass: 'custominearmonitor' 
							        }
							        /*
							   		service: "gmail",
								    host: "smtp.gmail.com",
								    auth: {
								    	XOAuth2: {
									    user: "iemaniamailer@gmail.com", // Your gmail address.
									                                            // Not @developer.gserviceaccount.com
									    clientId: "469090838515-jiih1k2plbij320lboaftcikbj9t7l10.apps.googleusercontent.com",
									    clientSecret: "OWqHDggE02angzrCBErAsWZT",
									    refreshToken: "1/9HSWcpu4cxDCWtKUNePFyr_y4JE3uR4R1x1W0Pl7pG0"
								    	}
								 	 }	
							   		*/
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

							    transporter.sendMail(mailOptions1, (error, info)=>{
							        if (error) {
							            return console.log(error);
							        }
							        console.log('Message sent: %s', info.messageId);
							        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
							     });

							    transporter.sendMail(mailOptions2, (error, info)=>{
							        if (error) {
							            return console.log(error);
							        }
							        console.log('Message sent: %s', info.messageId);
							        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
							     });
							});
							res.redirect('/products/'+id+'/send');    //---change this
						}
					});
				}
			});
		}
	});
});

app.get('/products/:id/send', function(req,res) {
	var id = req.params.id;
	res.render('email', {
		message: 'Email Sent!'
		PID: id;
	});
});

app.get('/products/:id/email-exists', function(req,res) {
	res.render('email', {
		message: 'Email already exists!'
		PID: id; 
	});
});

app.get('/member/1', function(req,res) {
	res.render('member', {
		name: 'Jomar Vista',
		email: 'jdvista96@gmail.com',
		phone: '09423454782',
		imageurl: '/jomar.jpg',
		hobbies: ['Listening to music', 'Playing computer games']
	});
});

app.get('/member/2', function(req,res) {
	res.render('member', {
		name: 'Daniel Cortez',
		email: 'drobscortz@gmail.com',
		phone: '09971960972',
		imageurl: '/daniel.jpg',
		hobbies: ['Playing computer games', 'Watching youtube videos']
	});
});

app.post('/brands', function(req,res) { //brand list insert 
	var values =[];
	values = [req.body.brand_name,req.body.brand_description];
	console.log(req.body);
	console.log(values);
	client.query("INSERT INTO brands(brand_name, brand_description) VALUES($1, $2)", values, (err, res)=>{
		if (err) {
			console.log(err.stack)
			}
		else {
			console.log(res.rows[0])
		}
	});
	res.redirect('/brands');
});

app.get('/brands', (req,res)=>{ //brand list
	client.query('SELECT * FROM brands', (req, data)=>{
		var list = [];
		for (var i = 1; i < data.rows.length+1; i++) {
				list.push(data.rows[i-1]);
		}
		res.render('brands',{
			data: list
		});
	});
});

app.get('/brand/create', (req,res)=>{ //route to create brand html
	res.render('brand_create');
});



app.post('/categories', function(req,res){ //category list with insert new category query
	var values =[];
	values = [req.body.category_name];
	console.log(req.body);
	console.log(values);
	client.query("INSERT INTO products_category(category_name) VALUES($1)", values, (err, res)=>{
		if (err) {
			console.log(err.stack)
			}
		else {
			console.log(res.rows[0])
		}
	});
	res.redirect('/categories');
});


app.get('/categories', (req,res)=>{ //category list
	client.query('SELECT * FROM products_category', (req, data)=>{
		var list = [];
		for (var i = 1; i < data.rows.length+1; i++) {
				list.push(data.rows[i-1]);
		}
		res.render('categories',{
			data: list
		});
	});
});

app.get('/category/create', (req,res)=>{ //route to create category
	res.render('category_create');
});

app.get('/product/update/:id', (req,res)=>{
	var id = req.params.id;
	client.query('SELECT products.id, products.product_name, products.product_description, products.tagline, products.price, products.warranty, products.pic, products.category_id, products_category.category_name, products.brand_id, brands.brand_name FROM products INNER JOIN products_category ON products.category_id = products_category.id INNER JOIN brands ON products.brand_id = brands.id ORDER BY products.id' , (req, data)=>{
		var list = [];
		//console.log(data);
		for (var i = 1; i < data.rows.length+1; i++) {
			if (i==id) {
				list.push(data.rows[i-1]);
			}
		}
		//console.log(list);
			client.query('SELECT * FROM products_category', (req, data)=>{
			var list2 = [];
			for (var i = 1; i < data.rows.length+1; i++) {
				list2.push(data.rows[i-1]);
			}
			client.query('SELECT * FROM brands', (req, data)=>{
				var list3 = [];
				for (var i = 1; i < data.rows.length+1; i++) {
					list3.push(data.rows[i-1]);
				}
				res.render('product_update',{
					products: list,
					products_category: list2,
					brands: list3
				});
			});
		});
	});
});

app.post('/products/:id', function(req,res){
	console.log(req.body);
	var id = req.params.id;
	var values =[];
	values = [req.body.id,req.body.product_name,req.body.product_description,req.body.tagline,req.body.price,req.body.warranty,req.body.pic,req.body.category_id,req.body.brand_id];
	//
	//for updating via post -----------------------------------------------------WIP
	console.log(values);
	client.query('UPDATE products SET product_name = $2, product_description = $3, tagline = $4, price = $5, warranty = $6, pic = $7, category_id = $8, brand_id = $9 WHERE id = $1', values);
	res.redirect('/products/:'+id);
});

//MODULE 3 additions
app.get('/customers', (req,res)=>{
	client.query('SELECT * FROM customers', (req, data)=>{
		var list = [];
		for (var i = 1; i < data.rows.length+1; i++) {
				list.push(data.rows[i-1]);
		}
		res.render('customers',{
			data: list
		});
	});
});

app.get('/customers/:id', (req,res)=>{
	var id = req.params.id;
	console.log(id);
	client.query('SELECT orders.id, orders.customer_id, orders.product_id, orders.order_date, orders.quantity, customers.id, customers.email, customers.first_name, customers.last_name, customers.street, customers.municipality, customers.province, customers.zipcode, products.product_name FROM orders INNER JOIN customers ON orders.customer_id = customers.id INNER JOIN products ON orders.product_id = products.id WHERE orders.customer_id = $1', [id], (err, data)=>{
		if (err) {
			console.log(err);
		}
		else{
			var list = [];
			console.log(data.rows);
			list.push(data.rows[0]);
			res.render('customer_details',{
				data: list
			});
		}
	});
});

app.get('/orders', (req,res)=>{
	client.query('SELECT * FROM orders', (req, data)=>{
		var list = [];
		for (var i = 1; i < data.rows.length+1; i++) {
				list.push(data.rows[i-1]);
		}
		res.render('orders',{
			data: list
		});
	});
});
	
app.listen(3000,function() {
	console.log('Server started at port 3000');
});

app.listen(PORT);