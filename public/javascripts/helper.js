 var exports = module.exports = {};

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

      return 12742 * Math.asin(Math.sqrt(a)) * 1000; // Diameter of the earth in km (2 * 6371)
  },
  //gets the node attribute
  // right now just works on building node id and break
  // neat to work on every node using current location using node_id if building_id does not match
  getNode: function(node, graph){
    var temp;
    for(i=0; i < graph.length; i++){
      if(graph[i].building_id == node){
        temp = {node_id:graph[i].node_id, building_id:graph[i].building_id, root_id:graph[i].node_id, latlng:graph[i].latlng, weight:0, pathLength:0, fvalue:0, edge_id:0};
        break;
      }
    }
    return temp;
  },
  // returns nodes with highest f value
  getSuccessor: function(setItems){
    var temp;
    
    if(setItems.length > 1){
      for(i=0; i <= setItems.length; i++){
        temp = comparator(setItems[i], setItems[i + 1]);
      }
      return temp;
    } else if(setItems.length == 0){
      return null;
    } else {
      return setItems[0];
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
  getNeigh: function(graph, edges, node){
    var neighbours = [];
    
    // stores the starting vertex
    for(i=0; i < edges.length; i++){
      var neighTo = edges[i].to_node;
      var neighFrom = edges[i].from_node;
      if(neighTo == node.node_id){
        for(j=0;j < graph.length; j++){
          if(neighTo == graph[j].node_id){
            neighbours.push({node_id:graph[j].node_id, building_id:graph[j].building_id, root_id:node.node_id, latlng:graph[j].latlng, weight:edges[i].weight, pathLength:node.pathLength, fvalue:0, edge_id:edges[i].edge_id});
            break;
          }
        }
      } else if(neighFrom == node.node_id){
        for(j=0;j < graph.length; j++){
          if(neighFrom == graph[j].node_id){
            neighbours.push({node_id:graph[j].node_id, building_id:graph[j].building_id, root_id:node.node_id, latlng:graph[j].latlng, weight:edges[i].weight, pathLength:node.pathLength, fvalue:0, edge_id:edges[i].edge_id});
            break;
          }
        }
      }
    }

    return neighbours;
  },
  findG: function(root, neigh){
    return root.pathLength + neigh.weight;
  },
  findH: function(neigh, dest){
    return this.findDistance(neigh.latlng.x, neigh.latlng.y, dest.latlng.x, dest.latlng.y);
  },
  containsInClosedSet: function(node, closeSet){
    var bool = false;
    for(i=0; i < closeSet.length; i++){
      if(closeSet[i].node_id == node.node_id){
        bool = true;
        break;
      }
    }
    return bool;
  },
  containsInOpenSet: function(node, openSet){
    for(i=0; i < openSet.length; i++){
      var bool = false;
      if(openSet[i].node_id == node.node_id){
        bool = true;
        break;
      }
    }
    return bool;
  },
  checkNode: function(node, openSet){
    for(i=0; i < openSet.length; i++){
      if(openSet[i].node_id == node.node_id){
        if(openSet[i].fvalue > node.fvalue){
          openSet.splice(i, 1);
          openSet.push(node);
          break;
        }
      }
    }
    return openSet;
  },
  getPath: function(path, edges){
    var path = [];

    for(i=0; i < path.length; i++){
      for(i=0; i < edges.length; i++){
        if(path[i].edge_id == edges[i].edge_id){
          path.push(edges[i].sub_edges);
          break;
        }
      }
    }
    return path;
  },
  isInt: function(x) {
    return x % 1 === 0;
  }
};