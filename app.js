const express = require('express');
const path = require('path');
//const { Client } = require('pg');
const pg = require('pg');
const exphbs = require('express-handlebars');
const PORT = process.env.PORT || 5000

/*
const client = new Client({
	database: 'ddmihcu0i9oh4g',
	user: 'wagrbiqjyejffc',
	password: '3352d8150a25ae9b72764c1ec8c20576e8bc0c9d64a07224a2d18db21af77846',
	host: 'ec2-54-204-23-228.compute-1.amazonaws.com',
	port: 5432
});
const client = new Client({
	database: 'storedb',
	user: 'postgres',
	password: 'admin',
	host: 'localhost',
	port: 5432
});
*/

const connectionString = "postgres://wagrbiqjyejffc:3352d8150a25ae9b72764c1ec8c20576e8bc0c9d64a07224a2d18db21af77846@ec2-54-204-23-228.compute-1.amazonaws.com:5432/ddmihcu0i9oh4g"

pg.connect(connectionString, function(err, client, done) {
   .then(function() {
		console.log('connected to database!');
	})
	.catch(function() {
		console.log('Error');
	})
});

/*
CREATE TABLE Products(id SERIAL PRIMARY KEY, name varchar(80), type varchar(80), description varchar(200), brand varchar(80), price float(2), pic varchar(80));
INSERT INTO Products(name, type, description, brand, price) VALUES('Model 3', 'IEM', 'An In-Ear Monitor with a single dynamic driver.', 'ADVANCED', 4100.00);
//connect to database

client.connect()
	.then(function() {
		console.log('connected to database!');
	})
	.catch(function() {
		console.log('Error');
	})

	client.query('SELECT * FROM your_table', function(err, result) {
      done();
      if(err) return console.error(err);
      console.log(result.rows);
   });
*/


const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function(req,res) {

	client.query('SELECT * FROM Products', (req, data)=>{
		var list = [];
		for (var i = 0; i <= 1; i++) {
			list.push(data.rows[i]);
		}
		//add render here
	})
	/*
	*/
		res.render('home',{
			/*
			*/
			data: list,
			title: 'Top Products'
		});
});

app.get('/products', function(req,res) {
	res.render('products', {
		title: 'Top Products'
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

app.listen(3000,function() {
	console.log('Server started at port 3000');
});

app.listen(PORT);