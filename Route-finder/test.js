var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var parseurl = require('parseurl');
var tools = require('./public/javascripts/tools.js');

// accessing private modules
var cookieCre = require('./credentials.js')

var app = express();

//setting port 
app.set('port', process.env.PORT || 8080);

// using static middleware to access the folders
app.use(express.static(path.join(__dirname, 'public')));

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//used for parsing encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(cookieCre.cookieSecret));

//define routes
//app.use(require('./routes/index'));

// GET home page. viewed at http://localhost:8080
app.get('/', function(req, res) {
	// creating csrf token
    res.render('index.ejs', {csrf: 'CSRF TOKEN'});
});

var car = [];

//handling index form
app.post('/get_names', function(req, res) {
	console.log("Destination from " + req.body.hidden_first_loc + " to " + req.body.second_loc);
  var count = tools.shortestPath();
  //console.log("length is " + count.length);
  //for(i = 0; i < count.length; i++){
    //console.log("test " + count[i]);
  //}
  console.log(count);
	res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.type('text/html')
  res.status(404);
  res.render('404');
});

// error handlers
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(141);
  res.render('141');
});

// error handlers
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

var server = require('http').Server(app);
var io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('news', car);
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

server.listen(app.get('port'), function(){
  console.log('Server listening at port ' + app.get('port'));
});