var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var parseurl = require('parseurl');
var tools = require('./public/javascripts/tools.js');
var pg = require("pg");
var async = require("async");

var connectionString = process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/route';

// accessing private modules
var cookieCre = require('./credentials.js')

var app = express();

// socket io connection
var server = require('http').Server(app);
var io = require('socket.io')(server);

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

var path = [];

//handling index form
app.post('/get_names', function(req, res, next){
	console.log("Destination from " + req.body.hidden_first_loc + " to " + req.body.second_loc);
  var graph = [];
  var edges = [];
  var startVertex = req.body.hidden_first_loc;
  var endVertex = req.body.second_loc; // returned as string
  var nodeNeigh = [];
  var numVertices = nodes.length; // nodes will start from 0 in map
  var openSet = new Array(numVertices);
  var closeSet = new Array(numVertices);

  pg.connect(connectionString, function(err, client, done){
  if(err) {return console.error('error running query', err);}
    async.waterfall ([
      function(callback){
        console.log("First task");
        // SQL Query > Select Data
        client.query("SELECT * FROM graph ORDER BY node_id ASC", function(err, result){
          if(err) return console.log("COULD NOT PERFORM QUERY OPERATION " + err);

          for(i=0; i< result.rows.length; i++){
            var value = result.rows[i];
            console.log(value);
            graph.push(value);
          }

          callback();
        });
      },
      function(callback){
        client.query("SELECT * FROM edge ORDER BY edge_id ASC", function(err, result){
          if(err) return console.log("COULD NOT PERFORM QUERY OPERATION " + err);
          console.log(result);

          for(i=0; i< result.rows.length; i++){
            edges.push(value);
          }

          callback();
        });
      },
      function(callback){
        var startNode = getNode(startVertex, graph);
        var endNode = getNode(endVertex, graph);

        open.push(startNode);

        while (openSet.length){
          // method that will return the node with highest fvalue
          var current = getSuccessor(openSet);

          if(current == endVertex){
            break;
          }

          nodeNeigh = tools.getNeigh(edges, current);

          // this loop will add current node's neighbours to open set if their fvalue is lower than the list
          for(i=0;i< nodeNeigh.length; i++){
            var gvalue = findG(current, nodeNeigh[i]);
            var hvalue = findH(nodeNeigh[i], endNode);

            // current node f value
            var fvalue = gvalue + hvalue;

            // updating path length value
            nodeNeigh[i].pathLength = gvalue;
            
            // checking if closed set contains node with lower fvalue than successor, ignore if it exist and move to next one
            if(containsInClosedSet(nodeNeigh[i].edge_id, closeSet)){
              continue;
            }

            // checking if open set contains node with lower fvalue than successor, ignore if it exists and move to next one
            if(containsInOpenSet(nodeNeigh[i], openSet)){
              continue;
            } else {
              openSet.push(nodeNeigh[i]);
            }
          }

          // adding current node to closed set
          closeSet.push(current);
        }
        callback();
      },
      function(callback){
        path = getPath(closeSet, edges);
        callback();
      }
    ],
    function(err){
      if(err) return next(err);
      res.redirect('/');
    });
    done();
  });
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

io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('renderMap', path);
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

server.listen(app.get('port'), function(){
  console.log('Server listening at port ' + app.get('port'));
});