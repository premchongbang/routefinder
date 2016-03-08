var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/route';

//var client = new pg.Client(connectionString);
//client.connect();
var query = client.query('CREATE TABLE items(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)');
query.on('end', function() { client.end(); });

var results = [];
pg.connect(connectionString, function(err, client, done) {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
        }

    	var query = client.query('SELECT * FROM ipad');

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();        
        });
 
});

app.post('/get_names', function(req, res, next){
    console.log("Destination from " + req.body.hidden_first_loc + " to " + req.body.second_loc);
  var nodes = []; // need to specify the size for some outcome

  pg.connect(connectionString, function(err, client, done){
  if(err) {return console.error('error running query', err);}
    async.waterfall ([
      function(callback){
        // SQL Query > Select Data
        client.query("SELECT node_id FROM graph ORDER BY node_id ASC", function(err, result){
          if(err) return console.log("COULD NOT PERFORM QUERY OPERATION " + err);

          for(i=0; i< result.rows.length; i++){
          var value = result.rows[i];
          console.log(value);
          nodes.push(value);
          }

            for(i=0; i< nodes.length; i++){
              console.log("tester value 1 " + nodes[i]);
            }
        });

        callback(null, nodes);
      },
      function(arg1, callback){
        for(i=0; i< 2; i++){
          console.log("tester value 2 " + nodes[i]);
        }
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