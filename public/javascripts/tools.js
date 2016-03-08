 var exports = module.exports = {};
 var async = require("async");

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
  //gets the node attribute
  getNode: function(node, graph){
    for(i=0; i < graph.length; i++){
      if(graph[i].node_id == node){
        var temp = {node_id:graph[i].node_id, rootId:graph[i].node_id, latlng:graph[i].latlng, weight:0, pathLength:0, edge_id:0};
        return temp;
      }
    }
  },
  // returns nodes with highest f value
  getSuccessor: function(setItems){
    var temp;
    
    if(setItems.length > 1){
      for(i=0; i <= setItems.length; i++){
        temp = comparator[setItems[i], setItems[i + 1]);
      }
      return temp;
    } else if(setItems.length == 0){
      return null;
    } else {
      return setItems[1];
    }
  },
  comparator: function(item1, item2){
    if(item1.fvalue > item2.fvalue){
      return item1;
    } else {
      return item2;
    }
  },
  // stores current vertex neighbours and returns
  getNeigh: function(edges, node){
    var neighbours = [];
    var counter = 0;

    // stores the starting vertex
    //[currentVertex, pathLength, weight, edge_id]
    for(i=0; i < edges.length; i++){
      var neighTo = edges[i].toNode;
      var neighFrom = edges[i].fromNode;

      if(neighTo == node){
        neighbours[counter] = {node_id:graph[i].node_id, rootId:node.node_id, latlng:graph[i].latlng, weight:edges[i].weight, pathLength:node.pathLength, edge_id:edges.edge_id};;
        counter++;
      } else if(neighFrom == node){
        neighbours[counter] = {node_id:graph[i].node_id, rootId:node.node_id, latlng:graph[i].latlng, weight:edges[i].weight, pathLength:node.pathLength, edge_id:edges.edge_id};;
        counter++;
      }
    }

    return neighbours;
  },
  findG: function(root, neigh){
    return root.pathLength + findDistance(root.latlng, neigh.latlng);
  },
  findH: function(root, dest){
    return findDistance(root.latlng, dest.latlng);
  },
  containsInClosedSet: function(node, closeSet){
    var bool = false;
    for(i=0; i < closeSet.length; i++){
      if(closeSet[i].node_id == node.node_id)){
        bool = true;
        break;
      }
    }
    return bool;
  },
  containsInOpenSet: function(node, openSet){
    for(i=0; i < openSet.length; i++){
      var bool = false;
      if(closeSet[i].node_id == node.node_id){
        bool = true;
        break;
      }
    }
    return bool;
  },
  getPath: function(path, edges){
    var path = [];

    for(i=0; i < path.length; i++){
      for(i=0; i < edges.length; i++){
        if(path[i].edge_id == edges.edge_id){
          path = edges.sub_edges;
        }
      }
    }
    return path;
  }
};