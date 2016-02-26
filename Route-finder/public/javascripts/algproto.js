var exports = module.exports = {};

// for db
//var router = express.Router();
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/route';

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
       
  shortestRoute: function() {
    return "Hola";
  },

  shortestPath: function(){

    pg.connect(connectionString, function(err, client, done) {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        res.status(500);
        res.render('500');
      }

      // node start form 0 to match up with array positioning
      var query = client.query("SELECT * FROM graph ORDER BY node_id ASC");

      var numVertices = query.length;
      var nodes = new Array(numVertices);

      // Stream results back one row at a time in ascending order
      query.on('row', function(row) {
        nodes.push(row);
      });

      nodes[startVertex] = true;
      var pathLengths = new Array(numVertices); // stores the path length as distances add up
      var predecessors = new Array(numVertices);     // stores all the nodes/path with shortest distance
      var visitedNodes = new Array(numVertices); // stores all the visited nodes
    
      // initiating arrays
      predecessors[i] = startVertex; 
      pathLengths[startVertex] = 0;

      var closestDistance = Infinity;

      // setting all other path length to infinity
      for (i = 0; i <= numVertices; i++) {
        if(i != startVertex) {
          pathLengths[i] = closestDistance;
        }
      }

      var queue = new PriorityQueue();

      while(node != null) {
        queue.queue(query[3]);


        //nodes format [node_id, path_id, [[neighbour, path_id], [neighbour, path_id]]];
        for(i=0; i < nodes[4].length; i++){
          var temp = node[1];
          if(shortDis < temp){
            shortDis = temp;
            storeNeighbour = node[3][i][0];
          }
        }
      }
    )};
    return { "startVertex": startVertex,
             "pathLengths": pathLengths,
             "predecessors": predecessors };
  });
});
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
    shortestPath: function(){

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
      //for(i=0; i < result.rows.length; i++){
        //console.log(result.rows[i].latlng);
      //}
      client.end();
    });
  });
    return "hello";
  }
};