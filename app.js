const express = require('express');
const path = require('path');
//const { Client } = require('pg');
const exphbs = require('express-handlebars');
const PORT = process.env.PORT || 5000

/*
const client = new Client({
	database: 'storedb',
	user: 'postgres',
	password: 'admin',
	host: 'localhost',
	port: 5432
});

//connect to database

client.connect()
	.then(function() {
		console.log('connected to database!');
	})
	.catch(function() {
		console.log('Error');
	})
*/

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function(req,res) {
	res.render('home');
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
		hobbies: ['music', 'games']
	});
});

app.get('/member/2', function(req,res) {
	res.render('member', {
		name: 'Daniel Cortez',
		email: 'drobscortz@gmail.com',
		phone: '09971960972',
		imageurl: '/daniel.jpg',
		hobbies: ['games', 'watch']
	});
});

app.listen(3000,function() {
	console.log('Server started at port 3000');
});

app.listen(PORT);