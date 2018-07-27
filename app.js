const express = require('express');
const path = require('path');
const { Client } = require('pg');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const PORT = process.env.PORT || 5000

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
/*
CREATE TABLE Products(id SERIAL PRIMARY KEY, name varchar(80), type varchar(80), description varchar(300), brand varchar(80), price float(2), pic varchar(80));
INSERT INTO Products(name, type, description, brand, price, pic) VALUES('Genesis', 'Custom In-Ear Monitor', 'FlipEars Genesis is a single balanced armature driver custom in-ear monitors. It is an amazing entry-level CIEM, it is incomparable to other single driver IEMs.', 'Flipears', 8, '/genesis.jpg');
INSERT INTO Products(name, type, description, brand, price, pic) VALUES('Aiden', 'Custom In-Ear Monitor', 'FlipEars Aiden is a dual-driver custom in-ear monitor. This affordable CIEM is fit for audiophiles and musicians looking for aggressive and full sound with brilliant high frequency.', 'Flipears', 15,'/aiden.jpg');
INSERT INTO Products(name, type, description, brand, price, pic) VALUES('Trident', 'Custom In-Ear Monitor', 'Trident features elevated low-end and treble regions for a refined take on what would normally be considered a pop sound. Equipped with 3 Knowles balanced armature drivers per side.', 'Noble Audio', 30,'/trident.jpg');
INSERT INTO Products(name, type, description, brand, price, pic) VALUES('A6t', 'Custom In-Ear Monitor', 'The A6t builds off of our exceptional 6-driver design that quickly became the “in-ear monitor of choice” for touring musicians and discerning music lovers.', '64 Audio', 65,'/a6t.jpg');
INSERT INTO Products(name, type, description, brand, price, pic) VALUES('Legend X', 'Custom In-Ear Monitor', 'From its arsenal of 7 proprietary drivers to its industry leading, state-of-the-art 10-way synX crossover network, the Legend X is the culmination of everything extraordinary we do at Empire.', 'Empire Ears', 115,'/legend-x.jpg');
INSERT INTO Products(name, type, description, brand, price, pic) VALUES('Layla', 'Custom In-Ear Monitor', 'Layla is perfection, perfected. This IEM will replicate detail of instruments in a way that makes it feel like the musicians are in the room with you. Layla uses custom-made Pproprietary Balanced Armature Drivers with a 12 Driver configuration.', 'JH Audio', 150,'/layla.jpg');
*/
//View engine setup
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', function(req,res) {
	client.query('SELECT * FROM Products', (req, data)=>{
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

app.get('/products/:id', (req,res)=>{
	var id = req.params.id;
	client.query('SELECT * FROM Products', (req, data)=>{
		var list = [];
		for (var i = 0; i < data.rows.length+1; i++) {
			if (i==id) {
				list.push(data.rows[i-1]);
			}
		}
		res.render('products',{
			data: list
		});
	});
});

app.post('/products/:id/send', function(req, res) {
	console.log(req.body);
	var id = req.params.id;
	const output = `
		<p>You have a new contact request</p>
		<h3>Contact Details</h3>
		<ul>
			<li>Customer Name: ${req.body.name}</li>
			<li>Phone: ${req.body.phone}</li>
			<li>Email: ${req.body.email}</li>
			<li>Product ID: ${req.body.productid}</li>
			<li>Quantity ${req.body.quantity}</li>
		</ul>
	`;

	//nodemailer
	let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'iemaniamailer@gmail.com', 
            pass: 'custominearmonitors' 
        }
    });

    let mailOptions = {
        from: '"IEMania Mailer" <iemaniamailer@gmail.com>',
        to: 'jdvista96@gmail.com, killerbats1com@gmail.com, drobscortz@gmail.com',
        subject: 'IEMania Contact Request',
        //text: req.body.name,
        html: output
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        client.query('SELECT * FROM Products', (req, data)=>{
			var list = [];
			for (var i = 0; i < data.rows.length+1; i++) {
				if (i==id) {
					list.push(data.rows[i-1]);
				}
			}
			res.render('products',{
				data: list,
				msg: '---Email has been sent---'
			});
		});
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