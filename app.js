"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var webRequest = require("request");
var mysql = require("mysql");
var app = express();
var AWS = require("aws-sdk");
var cookie = require("cookie-parser");
var session = require("express-session");
var dynamodb = new AWS.DynamoDB();

/*dynamodb.batchGetItem(params, function (err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});*/

//Creation de la connexion database
var connectionMySQL = mysql.createConnection({
	host     : process.env.RDS_HOSTNAME || "testprojetannuel.cvtxo4p2k8sn.us-west-2.rds.amazonaws.com",
	user     : process.env.RDS_USERNAME || "gerome",
	password : process.env.RDS_PASSWORD || "Koala0311"
});
connectionMySQL.connect(function(err) {
	if (err)
		console.log(err);
});
connectionMySQL.query("use testprojetannuel");

AWS.config.update({
	region: "us-west-2"
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(session({
	"secret": "Iampotato",
	"store":  new session.MemoryStore({ reapInterval: 60000 * 10 }),
	resave: true,
	saveUninitialized: true
}));


app.get("/", function(req, res) {



	var docClient = new AWS.DynamoDB.DocumentClient();

	console.log("TEST");

	var params = {
		arn:aws:dynamodb:us-west-2:372716168858:table/Meds
	};

	docClient.query(params, function(err, data) {
		if (err) {
			console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
		} else {
			console.log("Query succeeded.");
			console.log(data);
			};
		});

	res.render("connect", {title: "Connexion"});
	
});

app.get("/query", function(req, res) {
	console.log(req.session)
	if (req.session.username) {
		res.render("query", {title: "Information pathologie",nom: req.session.username, job: req.session.role,});
	} else {
		res.redirect("/");
	}
});

app.get("/results", function(req, res) {
	res.render("results", {title: "Resultats"});
});




app.post("/query", function(req, res) {
	var potatoes = req.body.pathos;
	res.render("results", {title: "Resultats", processedResult: potatoes});
})

app.post("/", function(req, res) {

	if (!req.body.id) {
		console.log("User name is required")
		res.render("connect", {title: "Connexion"});
	} 
	else if (req.session.username) {
		res.redirect("/query");
	}
	else {
		connectionMySQL.query("SELECT * from user where user_name = ?",[req.body.id], function(err, user_identification){
			if (err){
				console.log(err)
				res.redirect("/");
			}

			if (user_identification[0]!==undefined){
				var name = user_identification[0].user_name;
				connectionMySQL.query("SELECT role_label from role where role_id = ?",[user_identification[0].user_role],function(err,result){
					if(err){console.log(err)};
					req.session.role = result[0].role_label;
					req.session.username = name;
					res.redirect("/query");
				})
			}

			else{
				console.log("pas de resultat")
				res.redirect("/");
			}

		})
	}
})

app.listen(process.env.PORT||1337, function() {
	console.log("Server is running...");
});