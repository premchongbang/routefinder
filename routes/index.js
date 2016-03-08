var express = require('express');
var router = express.Router();

// GET home page. viewed at http://localhost:8080
router.get('/', function(req, res) {
	// creating csrf token
    res.render('index.ejs', {csrf: 'CSRF TOKEN'});
});

//handling index form
router.post('/get_names', function(req, res) {
	console.log("Form " + req.query.form);
	console.log("Destination from " + req.body.first_loc + " to " + req.body.second_loc);
	res.send(add(req, res));
});

//defining a function
function add(req, res) {
	var a = req.body.first_loc;
	var b = req.body.second_loc;

	result = a + b;
	//res.render('home.html');
	res.send(result);
};

// catch 404 and forward to error handler
router.use(function(req, res, next) {
  res.type('text/html')
  res.status(404);
  res.render('404');
});

// error handlers
router.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

module.exports = router;
