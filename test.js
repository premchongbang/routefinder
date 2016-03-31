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
app.use(express.static(path.join(__dirname, 'node_modules')));

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//used for parsing encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(cookieCre.cookieSecret));

//define routes
//app.use(require('./routes/index'));

// for storing finished selected data publically
var finalPackage = [];

// GET home page. viewed at http://localhost:8080
app.get('/', function(req, res) {
  // creating csrf token
    res.render('index.ejs', {csrf: 'CSRF TOKEN'});
});

// redirect to login page when user wants to add event
app.get('/login', function(req, res, next) {
  finalPackage.push({name:"NOMATCH", data:[]});
  res.render('test.ejs');
});

// checking login detail
app.post('/login_check', function(req, res, next){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      done();
      console.log("Could not connect to bd");
      res.status(500);
      res.render(500);
    };

    // getting form attribute values
    var uName = req.body.login_name;
    var pw = req.body.password;
    var position = req.body.hidden_position;

    if(uName == "" || pw == ""){
      res.redirect('login');
    } else {
      async.waterfall([
        function(callback){
          var query = "SELECT * FROM student WHERE username = '"+ uName + "' AND password = '"+ pw + "'";
          client.query(query, function(err, result){
            if(err) {
              return callback(err, "db");
            } else {
              if(result.rows.length !== 1){
                return callback(err, "NoMatch");
              }
              done();
              callback(null);
            }
          });
        }],
        function(err, result){
          if(result == "NoMatch"){
            console.log(result);
            finalPackage.push({name:"NOMATCH", data:[]});
            res.redirect('/');
          } else if(result == "db"){
            console.log("could not perform Database query");
            finalPackage.push({name:"DBFAIL", data:[]});
            res.redirect('/');
          } else {
            console.log("Match Found");
            finalPackage.push({name:"MATCHFOUND", data:[{username: uName}]}); // send marker position
            res.render('login.ejs');
          }
      });
    }
  });
});

//adding event to database
app.post('/add_event', function(req, res, next){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      done();
      console.log("Could not connect to bd");
      res.status(500);
      res.render(500);
    };

    // getting form attribute values
    var society_name = req.body.society_name;
    var event_name = req.body.event_name;
    var date = req.body.date;
    var position = req.body.hidden_position.replace(/[a-zA-Z]/g, "");
    var description = req.body.des;
    var username = req.body.hidden_username;

    if(society_name == "" || event_name == "" || date == "" || description == ""){
      finalPackage.push({name:"MATCHFOUND", data:[{username: username}]});
      console.log("Incomplete Form");
      res.render('login.ejs');
    } else {
      async.waterfall([
        function(callback){

          var query = "INSERT INTO public.event(society_name, event_name, date, detail, latlng, student_username) VALUES ('"+ society_name +"', '"+ event_name +"', '"+ date +"', '"+ description +"', point"+ position +", '"+ username +"');";
          client.query(query, function(err){
            if(err){ 
              console.log(err);
              callback(err, "db");
            } else {
              done();
              callback(null);
            }
          });
        }
        ],
        function(err, result){
        if(result == "db"){
          console.log("Could not perform Database query");
          finalPackage.push({name:"DBFAIL", data:[]});
          res.redirect('/');
        }else {
          console.log("Event Added");
          res.redirect('/');
        }
      });
    }
  });
});

app.get('/get_events', function(req, res, next){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      done();
      console.log("Could not connect to bd");
      res.status(500);
      res.render(500);
    };

    // getting form attribute values
    var uName = req.body.login_name;
    var pw = req.body.password;
    var position = req.body.hidden_position;

    var store_event = [];

    async.waterfall([
      function(callback){
        client.query("SELECT * FROM event ORDER BY event_id ASC", function(err, result){
          if(err) {
            return callback(err, "db");
          } else {
            if(result.rows.length < 1){
              return callback(err, "NoEvent");
            } else {
              for(i=0; i< result.rows.length; i++){
                var value = result.rows[i];
                store_event.push(value);
              }
              done();
              callback(null);
            }
          }
        });
      }],
      function(err, result){
        if(result == "NoEvent"){
          console.log(result);
          finalPackage.push({name:"NOEVENTS", data:[]});
          res.redirect('/');
        } else if(result == "db"){
          console.log("could not perform Database query");
          finalPackage.push({name:"DBFAIL", data:[]});
          res.redirect('/');
        }else {
          console.log("Match Found");
          finalPackage.push({name:"SHOWEVENTS", data: store_event});
          res.redirect('/');
        }
      });
  });
});

//handling index form
app.post('/find_route', function(req, res, next){
  // returned latlng is string
  console.log("Destination from " + req.body.first_loc + " to " + req.body.second_loc);
  var graph = [];
  var edges = [];
  // getting rid of white-space and converting in upper case letter
  var startVertex = (req.body.first_loc).replace(/\s/g, "").toUpperCase();
  var endVertex = (req.body.second_loc).replace(/\s/g, "").toUpperCase(); 
  
  var openSet = []; // storing nodes to be explored
  var closeSet = []; // storing  nodes which are explored
  var path = []; // stores the path 

  // need a page with msg when invalid input
  // checks for invalid input against empty string, space and non-integers
  if(startVertex == "" && endVertex == ""){
    console.log(1);
    res.redirect('/');
  } else {
    if(!helper.checkInputValidity(endVertex)){
      console.log(2);
      res.redirect('/');
    } else if(startVertex == "" || helper.checkInputValidity(startVertex)){
      if(startVertex == ""){
        console.log(3);
        setTimeout(console.log("waiting"),5000);
        startVertex = req.body.hidden_first_loc;
        console.log(startVertex);
      }

  // connecting to db and handeling error
  pg.connect(connectionString, function(err, client, done){
    if(err){
      done();
      console.log("Could not connect to bd");
      res.status(500);
      res.render(500);
    };
    // for synchronious operation of task
    async.waterfall ([
      function(callback){
        // selecting data from graph table
        // return value { node_id: 79, latlng: { x: 50.93459, y: -1.39818 }, building_id: null }
        client.query("SELECT * FROM graph ORDER BY node_id ASC", function(err, result){
          if(err){
            callback(err, "db");
          } else {
            //pushing db returned dat to local array
            for(i=0; i< result.rows.length; i++){
              var value = result.rows[i];
              graph.push(value);
            }

            console.log("Got nodes");
            callback(null);
          }
        });
      },
      function(callback){
        // { edge_id: 124, weight: 57.86, sub_edges: '((50.93409,-1.39626),(50.93412,-1.39627),(50.93416,-1.39612),(50.93438,-1.39597),(50.93434,-1.39581),(50.93438,-1.39558))', from_node: 18, to_node: 37}
        client.query("SELECT * FROM edge ORDER BY edge_id ASC", function(err, result){
          if(err){
            callback(err, "db");
          } else {
            //pushing db returned dat to local array
            for(i=0; i< result.rows.length; i++){
              var value = result.rows[i];
              edges.push(value);
            }
            console.log("Got edges");
          }
          callback(null);
        });
      },
      function(callback){
        console.log("starting alg");
        var nodeNeigh = [];

        // { node_id: 74, building_id: '2    ',rootId: 74, latlng: { x: 50.93644, y: -1.39781 }, weight: 0, pathLength: 0, edge_id: 0 }
        var startNode = helper.getNode(startVertex, graph);
        var endNode = helper.getNode(endVertex, graph);


        // checking for valid node
        if(startNode == null){
          return callback(err, "Invalid input");
        } else if(endNode == null){
          return callback(err, "Invalid input");
        }

        openSet.push(startNode);
        closeSet.push(startNode);

        while (openSet.length){
          // returns single node the node with lowest fvalue
          //{ node_id: 2, root_id: 2, latlng: { x: 50.93576, y: -1.39827 }, weight: 0, pathLength: 0, fvalue: 0, edge_id: 0 }
          var current = helper.getSuccessor(openSet, endNode);

          if(current.node_id !== endNode.node_id){
            //remove the current node from open set and add it to closed set
            var index = openSet.indexOf(current);
            openSet.splice(index, 1);
            closeSet.push(current);
            
            // return array of neighbours
            //{ node_id: 4, root_id: 2, latlng: { x: 50.93576, y: -1.39827 }, weight: 49.38, pathLength: 0, fvalue: 0, edge_id: 56 }
            nodeNeigh = helper.getNeigh(graph, edges, current);

            // this loop will add current node's neighbours to open set if their fvalue is lower than the list
            for(i=0; i < nodeNeigh.length; i++){
              // checking if closed set contains node with lower fvalue than successor, ignore if it exist and move to next one
              if(helper.containsInClosedSet(nodeNeigh[i], closeSet)){
                openSet = helper.checkNode(nodeNeigh[i], closeSet);
                continue;
              } else {

                var gvalue = helper.findG(current, nodeNeigh[i]);
                var hvalue = helper.findH(nodeNeigh[i], endNode);

                // updating path length value
                nodeNeigh[i].pathLength = gvalue;
                nodeNeigh[i].fvalue = (gvalue + hvalue);

                // checking if open set contains node with lower fvalue than successor, ignore if it exists and move to next one  
                if(helper.containsInOpenSet(nodeNeigh[i], openSet)){      
                  // checks if current node f value is lower than previous one and replace it if true
                  openSet = helper.checkNode(nodeNeigh[i], openSet);
                } else {
                  //need to check if current node has lower f value
                  openSet.push(nodeNeigh[i]);
                }
              }
            }
          } else {
            console.log("path found");
            closeSet.push(current);
            break;
          }
        }
        console.log("alg end");

        // getting the path
        path = helper.getPath(startNode, closeSet, edges);
        finalPackage.push(helper.getObject("PATH", path));
        callback(null);
      }],
      function(err, result){
        // need separate page for handeling invalid input error
        if(result == "Invalid input"){
          done(); 
          console.log("Not valid input")
          res.redirect('/');
        } else if(result == "db"){
          done();
          console.log("Database could not perform query");
          finalPackage.push({name:"DBFAIL", data:[]});
          res.redirect('/');
        } else {
          done();
          console.log("Redirected");
          res.redirect('/');
        }
    });
  });
} else{
  console.log(4);
  res.redirect('/');
}}
});

// catch 404 and forward to error handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.type('text/html');
  res.status(404);
  res.render('404');
});

// error handlers
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

io.on('connection', function(socket){
  console.log('User Connected');
  socket.emit('renderMap', finalPackage);
  finalPackage = [];
  socket.on('disconnect', function(){
    console.log('User Disconnected');
  });
});

server.listen(app.get('port'), function(){
  console.log('Server listening at port ' + app.get('port'));
});