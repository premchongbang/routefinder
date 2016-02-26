var exports = module.exports = {};

// for db
//var router = express.Router();
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/route';
//var client = new pg.Client(connectionString);

module.exports = {
  // finding the distane between two latitude and longitude point using Haversine formula
  findDistance: function(lat1, lon1, lat2, lon2){
      var deg2rad = 0.017453292519943295; // === Math.PI / 180
      var cos = Math.cos;
      lat1 *= deg2rad;
      lon1 *= deg2rad;
      lat2 *= deg2rad;
      lon2 *= deg2rad;
      var a = (
          (1 - cos(lat2 - lat1)) +
          (1 - cos(lon2 - lon1)) * cos(lat1) * cos(lat2)
          ) / 2;

      return 12742 * Math.asin(Math.sqrt(a)); // Diameter of the earth in km (2 * 6371)
  },

  shortestPath: function(){
    var nodes = [];
    pg.connect(connectionString, function(err, client, done) {
        if(err) {
          return console.error('error running query', err);
        }
     // client.query('SELECT * FROM graph, edge', function(err, result);
        var query = client.query("SELECT * FROM graph");

        // Stream results back one row at a time
        query.on('row', function(row) {
            nodes.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function(result) {
            done();
            console.log(result.rowCount + ' rows were received');
        });
    });

    //for(i=0; i < nodes.length; i++){
      //console.log(nodes.length);
    //}

    return "hello";
  },

  constructPath: function(shortestPathInfo, endVertex){
    var path = [];
    while (endVertex != shortestPathInfo.startVertex) {
      path.unshift(endVertex);
      endVertex = shortestPathInfo.predecessors[endVertex];
    }
    return path;
  },

  shortPath: function(){

    var nodes = [];
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }

      client.query("SELECT * FROM graph ORDER BY node_id ASC", function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        nodes = result;
      for(i=0; i < result.rows.length; i++){
        console.log(result.rows[i].latlng);
      }
      client.end();
    });
  });
    return "hello";
  }
};