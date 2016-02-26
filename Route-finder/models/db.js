var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/route';

//var client = new pg.Client(connectionString);
//client.connect();


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