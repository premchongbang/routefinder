var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var parseurl = require('parseurl');
var helper = require('./public/javascripts/helper.js');
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
  var startVertex = parseInt(req.body.first_loc);
  var endVertex = parseInt(req.body.second_loc); // returned as string
  var openSet = new Array();
  var closeSet = new Array();

  if(helper.isInt(startVertex) && helper.isInt(endVertex)){
    console.log("input is " + typeof startVertex + typeof endVertex);
    pg.connect(connectionString, function(err, client, done){
      if(err) {return console.error('error running query', err);}
      async.waterfall ([
        function(callback){
          console.log("First task");
          // SQL Query > Select Data
          // return value { node_id: 79, latlng: { x: 50.93459, y: -1.39818 }, building_id: null }
          client.query("SELECT * FROM graph ORDER BY node_id ASC", function(err, result){
            if(err) return console.log("COULD NOT PERFORM QUERY OPERATION " + err);

            for(i=0; i< result.rows.length; i++){
              var value = result.rows[i];
               //console.log(value);
              graph.push(value);
            }
            console.log("got nodes");
            callback();
          });
        },
        function(callback){
          // { edge_id: 124, weight: 57.86, sub_edges: '((50.93409,-1.39626),(50.93412,-1.39627),(50.93416,-1.39612),(50.93438,-1.39597),(50.93434,-1.39581),(50.93438,-1.39558))', from_node: 18, to_node: 37}
          client.query("SELECT * FROM edge ORDER BY edge_id ASC", function(err, result){
             if(err) return console.log("COULD NOT PERFORM QUERY OPERATION " + err);

            for(i=0; i< result.rows.length; i++){
              var value = result.rows[i];
              //console.log(value);
              edges.push(value);
            }
            console.log("got edges");
            callback();
         });
        },
        function(callback){
          console.log("starting alg");
          var nodeNeigh = [];
          // { node_id: 74, building_id: '2    ',rootId: 74, latlng: { x: 50.93644, y: -1.39781 }, weight: 0, pathLength: 0, edge_id: 0 }
          var startNode = helper.getNode(startVertex, graph);
          var endNode = helper.getNode(endVertex, graph);

          openSet.push(startNode);

          while (openSet.length){
            // returns single node the node with highest fvalue
            var current = helper.getSuccessor(openSet);

            if(current !== null){
              if(current.node_id !== endNode.node_id){
                //remove the current node from open set and add it to closed set
                var index = openSet.indexOf(current);
                openSet.splice(index, 1);
                closeSet.push(current);
                
                // return array of neighbours
                nodeNeigh = helper.getNeigh(graph, edges, current);

                // this loop will add current node's neighbours to open set if their fvalue is lower than the list
                for(i=0; i< nodeNeigh.length; i++){
                  // checking if closed set contains node with lower fvalue than successor, ignore if it exist and move to next one
                  if(helper.containsInClosedSet(nodeNeigh[i], closeSet)){
                    continue;
                  } else {
                    var gvalue = helper.findG(current, nodeNeigh[i]);
                    var hvalue = helper.findH(nodeNeigh[i], endNode);

                    // updating path length value
                    nodeNeigh[i].pathLength = gvalue;
                    nodeNeigh[i].fvalue = (gvalue + hvalue);

                    if(helper.containsInOpenSet(nodeNeigh[i], openSet)){              // checking if open set contains node with lower fvalue than successor, ignore if it exists and move to next one
                      // checks if current node f value is lower than previous one and replace it if true
                      openSet = checkNode(nodeNeigh[i], openSet);
                    } else {
                      //need to check if current node has lower f value
                      openSet.push(nodeNeigh[i]);
                    }
                  }
                }
              } else {
                while(openSet.length > 0) {
                  openSet.pop();
                };
                break;
              }
            } else {
              console.log("while loop broke due to empty list, so path found");
              break;
            }
          }
          
          console.log("alg end");
          callback();
        },
        function(callback){
          path = helper.getPath(closeSet, edges);
          callback();
        }],
        function(err){
          if(err) return next("error in async " + err);
          res.redirect('/');
        });
      });
    } else {
    console.log("input value not integer");
    console.log(startVertex);
    res.redirect("/");
  }
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