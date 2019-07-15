/* eslint-disable no-console */
/* eslint-disable no-undef */
var express = require("express");
var bodyParser = require("body-parser");
var routes = require("./routes/routes.js");

var app = express();
var port=process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/ping', routes.ping);

app.listen(port);

console.log('Server Listening at port'+port);