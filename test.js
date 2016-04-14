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
var geolib = require("geolib");

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

// information carrier which carries data as object
var finalPackage = [{name:"NOACTION", data:{}}];

// GET home page. viewed at http://localhost:8080
app.get('/', function(req, res) {
  res.render('index.ejs');
});

// redirect to login page when user wants to add event
app.get('/login', function(req, res, next) {
  res.render('login.ejs');
});

// redirect to login page when user wants to add event
app.get('/event', function(req, res, next) {
  res.render('event.ejs');
});

app.get('/editor', function(req, res, next) {
  res.render('editor.ejs');
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
    var user_name = req.body.login_name;
    var pw = req.body.password;
    var store_event = [];

    if(user_name == "" || pw == ""){
      res.redirect('login');
    } else {
      async.waterfall([
        function(callback){
          var query = "SELECT * FROM student WHERE username = '" + user_name + "' AND password = '"+ pw + "'";
          client.query(query, function(err, result){
            if(err) {
              return callback(err, "db");
            } else {
              if(result.rows.length < 1){
                return callback(err, "Login Fail");
              } else {
                done();
                callback(null);
              }
            }
          });
        }
        ],
        function(err, result){
          if(result == "Login Fail"){
            console.log(result);
            finalPackage.push({name:"LOGINFAIL", data:{}});
            res.redirect('/login');
          } else if(result == "db"){
            console.log("could not perform Database query");
            finalPackage.push({name:"DBFAIL", data:{}});
            res.redirect('/');
          } else {
            console.log("Match Found");
            finalPackage.push({name:"LOGGEDIN", data:{}, username:user_name});
            res.redirect('/event');
          }
      });
    }
  });
});

//adding event to database
app.post('/add_event', function(req, res, next) {
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
    var user_name = req.body.hidden_username;
    var venue = req.body.venue;
    console.log(user_name);

    if(user_name == "undefined" || society_name == "" || event_name == "" || date == "" || description == "" || !helper.checkDate(date)){
      finalPackage.push({name:"INCOMPLETEFORM", data:{}, username: user_name});
      console.log("Incomplete Form");
      res.redirect('/event');
    } else {
      async.waterfall([
        function(callback){

          var query = "INSERT INTO public.event(organiser, event_title, date, detail, latlng, student_username, venue) VALUES ('"+ society_name +"', '"+ event_name +"', '"+ date +"', '"+ description +"', point"+ position +", '"+ user_name +"', '"+ venue +"');";
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
          finalPackage.push({name:"DBFAIL", data:{}});
          res.redirect('/');
        }else {
          console.log("Event Added");
          finalPackage.push({name:"EVENTADDED", data:{}, username:user_name});
          res.redirect('/event');
        }
      });
    }
  });
});

// for editing user events
app.post('/edit_event', function(req, res, next) {
  pg.connect(connectionString, function(err, client, done){
    if(err){
      done();
      console.log("Could not connect to bd");
      res.status(500);
      res.render(500);
    };

    // getting form attribute values
    var user_name = req.body.hidden_username;

    if(user_name == ""){
      res.redirect('/login');
    } else {
      var store_event = [];
      async.waterfall([
        function(callback){
          var query = "SELECT * FROM event WHERE student_username = '" + user_name + "'";
          client.query(query, function(err, result){
            if(err) {
              return callback(err, "db");
            } else {
              for(i=0; i < result.rows.length; i++){
                var value = result.rows[i];
                store_event.push(value);
              }
              if(store_event.length < 1){
                 return callback(err, "No Event");
              } else{
                done();
                callback(null);
              }
            }
          });
        }
        ],
        function(err, result){
          if(result == "No Event"){
            console.log(result);
            finalPackage.push({name:"NOUSEREVENT", data:{}, username:user_name});
            res.redirect("/event");
          } else if(result == "db"){
            console.log("could not perform Database query");
            finalPackage.push({name:"DBFAIL", data:{}});
            res.redirect('/');
          } else {
            console.log("Event Found");
            finalPackage.push({name:"EDITEVENT", data:store_event, username:user_name});
            res.redirect('/editor');
        }
      });
    }
  });
});

// checking login detail
app.post('/go_eventpage', function(req, res, next){
  // getting form attribute values
  var user_name = req.body.hidden_username;
  finalPackage.push({name:"LOGGEDIN", data:{}, username:user_name});
  res.redirect('/event');
});

//updating event in database
app.post('/update_event', function(req, res, next){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      done();
      console.log("Could not connect to bd");
      res.status(500);
      res.render(500);
    };

    // getting form attribute values
    var society_name = req.body.society_name;
    var event_title = req.body.event_name;
    var date = req.body.date;
    var description = req.body.des;
    var user_name = req.body.hidden_username;
    var event_id = req.body.hidden_event_id;
    var venue = req.body.venue;
    var btn = req.body.btn_action;
    var store_event =[];

    if(btn == "Update"){
      if(user_name == "" || society_name == "" || event_title == "" || date == "" || description == "" || !helper.checkDate(date)){
        async.waterfall([
          function(callback){
            var query = "SELECT * FROM event WHERE  student_username ='" + user_name + "' ORDER BY event_id ASC;";
            client.query(query, function(err, result){
              if(err) {
                return callback(err, "db");
              } else {
                for(i=0; i< result.rows.length; i++){
                  var value = result.rows[i];
                  store_event.push(value);
                }
                done()
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
            } else {
              finalPackage.push({name:"INCOMPLETEFORM2", data:store_event, username:user_name});
              console.log("Incomplete Form for Update");
              res.redirect('/editor');
            }
        });
      } else {
        async.waterfall([
          function(callback){
            var query = "UPDATE public.event SET organiser='"+ society_name + "', event_title='"+ event_title + "', date='"+ date + "', detail='"+ description+ "', venue='"+ venue + "' WHERE event_id='"+ event_id +"';";
            client.query(query, function(err){
              if(err){
                console.log(err);
                return callback(err, "db");
              } else {
                done();
                callback(null);
              }
            });
          },
          function(callback){
            var query = "SELECT * FROM event WHERE  student_username ='" + user_name + "' ORDER BY event_id ASC;";
            client.query(query, function(err, result){
              if(err) {
                return callback(err, "db");
              } else {
                for(i=0; i< result.rows.length; i++){
                  var value = result.rows[i];
                  store_event.push(value);
                }
                done()
                callback(null);
              }
            });
          }
          ],
          function(err, result){
            if(result == "db"){
              console.log("Could not perform Database query");
              finalPackage.push({name:"DBFAIL", data:{}});
              res.redirect('/');
            } else {
              console.log("Event Updated");
              finalPackage.push({name:"UPDATED", data:store_event, username:user_name});
              res.redirect('/');
            }
        });
      }
    } else {
      async.waterfall([
        function(callback){
          var query = "DELETE FROM event WHERE event_id = '"+ event_id +"';";
          client.query(query, function(err){
            if(err){ 
              console.log(err);
               return callback(err, "db");
            } else {
              done();
              callback(null);
            }
          });
        },
        function(callback){
          var query = "SELECT * FROM event WHERE  student_username ='" + user_name + "' ORDER BY event_id ASC;";
          client.query(query, function(err, result){
            if(err) {
              return callback(err, "db");
            } else {
              for(i=0; i< result.rows.length; i++){
                var value = result.rows[i];
                store_event.push(value);
              }
              done()
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
          } else {
            console.log("Event Deleted");
            finalPackage.push({name:"DELETED", data:store_event, username:user_name});
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

    var store_event = [];

    async.waterfall([
      function(callback){
        client.query("SELECT * FROM event ORDER BY event_id ASC", function(err, result){
          if(err) {
            return callback(err, "db");
          } else {
            if(result.rows.length < 1){
              return callback(err, "No Event");
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
        if(result == "No Events"){
          console.log(result);
          finalPackage.push({name:"NOEVENTS", data:{}});
          res.redirect('/');
        } else if(result == "db"){
          console.log("could not perform Database query");
          finalPackage.push({name:"DBFAIL", data:[]});
          res.redirect('/');
        }else {
          console.log("Events Found");
          finalPackage.push({name:"SHOWEVENTS", data:store_event});
          res.redirect('/');
        }
      });
  });
});

//handling index form
app.post('/find_route', function(req, res, next){
  // getting rid of white-space and converting in upper case letter
  var startVertex = (req.body.first_loc).replace(/\s/g, "").toUpperCase();
  console.log(startVertex);
  var endVertex = (req.body.second_loc).replace(/\s/g, "").toUpperCase();
  console.log(endVertex);
  var currentLoc = (req.body.hidden_first_loc).replace(/[a-zA-Z]/g, "");
  var accessID = req.body.hidden_disable_value;

  console.log("Destination from " + endVertex + " to " + currentLoc);
  
  var graph = [];
  var edges = [];
  var openSet = []; // storing nodes to be explored
  var closeSet = []; // storing  nodes which are explored
  var path = []; // stores the path 

  // need a page with msg when invalid input
  // checks for invalid input against empty string, space and non-integers
  if(startVertex == "" && endVertex == "") {
    console.log(1);
    res.redirect('/');
  } else {
    if(endVertex == "" || !helper.checkInputValidity(endVertex)){
      console.log(2);
      res.redirect('/');
    } else if(startVertex !== "" && helper.checkInputValidity(startVertex) || currentLoc !== ""){
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
          //{ node_id: 74, building_id: '2    ',rootId: 74, latlng: { x: 50.93644, y: -1.39781 }, weight: 0, pathLength: 0, edge_id: 0 }
          client.query("SELECT * FROM graph ORDER BY node_id ASC", function(err, result){
            if(err){
              return callback(err, "db");
            } else {
              //pushing db returned dat to local array
              for(i=0; i< result.rows.length; i++){
                var value = result.rows[i];
                graph.push(value);
              }
            }
            console.log("Got nodes");
            callback(null);
          });
        },
        function(callback){
          if(accessID == "ON"){
            // { edge_id: 124, weight: 57.86, sub_edges: '((50.93409,-1.39626),(50.93412,-1.39627),(50.93416,-1.39612),(50.93438,-1.39597),(50.93434,-1.39581),(50.93438,-1.39558))', from_node: 18, to_node: 37}
            client.query("SELECT * FROM edge WHERE access_id = 0 ORDER BY edge_id ASC", function(err, result){
              if(err){
                return callback(err, "db");
              } else {
                //pushing db returned dat to local array
                for(i=0; i< result.rows.length; i++){
                  var value = result.rows[i];
                  edges.push(value);
                }
              }
              console.log("Got edges with assisted route");
              callback(null);
            });
          } else {
            // { edge_id: 124, weight: 57.86, sub_edges: '((50.93409,-1.39626),(50.93412,-1.39627),(50.93416,-1.39612),(50.93438,-1.39597),(50.93434,-1.39581),(50.93438,-1.39558))', from_node: 18, to_node: 37}
            client.query("SELECT * FROM edge ORDER BY edge_id ASC", function(err, result){
              if(err){
                return callback(err, "db");
              } else {
                //pushing db returned dat to local array
                for(i=0; i< result.rows.length; i++){
                  var value = result.rows[i];
                  edges.push(value);
                }
              }
              console.log("Got edges");
              callback(null);
            });
          }
        },
        function(callback){
          console.log("starting alg");
          var nodeNeigh = [];
          var startNode, endNode;

          if(startVertex !== ""){
            // { node_id: 74, building_id: '2    ',rootId: 74, latlng: { x: 50.93644, y: -1.39781 }, weight: 0, pathLength: 0, edge_id: 0 }
            startNode = helper.getStartNode(startVertex, graph);
            endNode = helper.getEndNode(startNode, endVertex, accessID, graph);
          } else {
            var loc = currentLoc.replace(/[(,)]/g,"");
            var res = loc.split(" ");
            var lat = res[0];
            var lng = res[1];
            var store = []; //stores node close to current co-ordinate

            // gets all the close nodes using the current co-ordinate
            for(i=0; i < graph.length; i++){
              if(geolib.isPointInCircle({latitude: graph[i].latlng.x, longitude: graph[i].latlng.y}, {latitude: lat, longitude: lng}, 50)){
                store.push(graph[i]);
              }
            }

            if(store.length >= 1){
              startNode = helper.getCurrentStartNode(store, lat, lng);
              endNode = helper.getEndNode(startNode, endVertex, accessID, graph);
            } else {
              return callback(err, "No neighbouring node");
            }
          }

          // checking for valid node
          if(startNode == null){
            return callback(err, "Invalid input");
          } else if(endNode == null){
            return callback(err, "Invalid input");
          }

          openSet.push(startNode);

          while (openSet.length){
            // returns single node the node with lowest fvalue
            //{ node_id: 2, root_id: 2, latlng: { x: 50.93576, y: -1.39827 }, weight: 0, pathLength: 0, fvalue: 0, edge_id: 0 }
            var current = helper.getSuccessor(openSet, endNode);

            if(current.node_id !== endNode.node_id){
              // prevents start node being evaluated again. if pathlength is greather than 0 then ignore it
              if(helper.checkForStartNode(current, startNode)){
                // return array of neighbours
                //{ node_id: 4, root_id: 2, latlng: { x: 50.93576, y: -1.39827 }, weight: 49.38, pathLength: 0, fvalue: 0, edge_id: 56 }
                nodeNeigh = helper.getNeigh(graph, edges, current);

                // this loop will add current node's neighbours to open set if their fvalue is lower than the list
                for(i=0; i < nodeNeigh.length; i++){
                  
                  var gvalue = helper.findG(current, nodeNeigh[i]);
                  var hvalue = helper.findH(nodeNeigh[i], endNode);

                  // updating path length value
                  nodeNeigh[i].pathLength = gvalue;
                  nodeNeigh[i].fvalue = (gvalue + hvalue);

                  // checking if closed set contains node
                  if(helper.containsInSet(nodeNeigh[i], closeSet)){
                    // remove node if successor node f value is lower and add successor node to openlist
                    closeSet = helper.checkNode(nodeNeigh[i], closeSet);
                    openSet.push(nodeNeigh[i]);
                  // checking if open set contains node  
                  } else if(helper.containsInSet(nodeNeigh[i], openSet)){      
                    // remove node if successor node f value is lower and add successor node to openlist
                    openSet = helper.checkNode(nodeNeigh[i], openSet);
                    openSet.push(nodeNeigh[i]);
                  } else {
                    openSet.push(nodeNeigh[i]);
                  }
                }

                //remove the current node from open set and add it to closed set
                var index = openSet.indexOf(current);
                openSet.splice(index, 1);
                closeSet.push(current);
              } else {
                var index = openSet.indexOf(current);
                openSet.splice(index, 1);
                closeSet.push(current);
              }
            } else {
              console.log("path found");
              closeSet.push(current);
              break;
            }
          }
          console.log("alg end");
          if(closeSet.length < 0){
            return callback(err, "No Path");
          } else {
            // getting the path
            path = helper.getPath(startNode, closeSet, edges);
            finalPackage.push(helper.getObject("PATH", path, startNode, endNode));
            callback(null);
          }
        }],
        function(err, result){
          // need separate page for handeling invalid input error
          if(result == "Invalid input"){
            done(); 
            console.log("Not valid input")
            finalPackage.push({name:"INVALIDINPUT", data:[]});
            res.redirect('/');
          } else if(result == "db"){
            done();
            console.log("Database could not perform query");
            finalPackage.push({name:"DBFAIL", data:[]});
            res.redirect('/');
          } else if(result == "No Path"){
            console.log("No path found");
            finalPackage.push({name:"NOPATH", data:[]});
            res.redirect('/');
          } else if(result == "No neighbouring node"){
            console.log("No neighbouring node to current point");
            finalPackage.push({name:"CURRENTLOCFAIL", data:[]});
            res.redirect('/');
          } else {
            done();
            console.log("Redirected");
            res.redirect('/');
          }
        });
      });
    } else {
      console.log(4);
      finalPackage.push({name:"INVALIDINPUT", data:[]});
      res.redirect('/');
    }
  }
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