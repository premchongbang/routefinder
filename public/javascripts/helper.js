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
  // ??? right now just works on building node id and break
  // neat to work on every node using current location using node_id if node_id does not match
  getNode: function(node, graph){
    var temp;

    for(i=0; i < graph.length; i++){
      if(graph[i].node_id == parseInt(node)){
        temp = {node_id:graph[i].node_id, root_id:graph[i].node_id, latlng:graph[i].latlng, weight:0, pathLength:0, fvalue:0, edge_id:0};
        break;
      }
    }

    if(temp == null){
      return null;
    } else {
      return temp;
    }
  },
  // returns nodes with highest f value
  getSuccessor: function(setItems){
    var temp;
    var temp2;
    var setLen = setItems.length;
    
    if(setLen > 2){
      for(i=0; i < (setLen - 1); i++){
        temp = this.comparator(setItems[i], setItems[i + 1]);
        if(i < 1){
          temp2 = temp;
        } else {
          temp2 = this.comparator(temp, temp2);
        }
      }
      return temp2;
    } else if(setLen == 2){
      return this.comparator(setItems[0], setItems[1]);
    } else {
      return setItems[0];
    }
  },
  comparator: function(item1, item2){
    if(item1.fvalue < item2.fvalue){
      return item1;
    } else {
      return item2;
    }
  },
  // stores current vertex neighbours and returns
  getNeigh: function(graph, edges, root){
    var neighbours = [];
    
    // stores the starting vertex
    for(i=0; i < edges.length; i++){
      var neighTo = edges[i].to_node;
      var neighFrom = edges[i].from_node;
      if(neighTo == root.node_id){
        for(j=0;j < graph.length; j++){
          if(neighTo == graph[j].node_id){
            neighbours.push({node_id:neighFrom, root_id:root.node_id, latlng:graph[j].latlng, weight:edges[i].weight, pathLength:root.pathLength, fvalue:0, edge_id:edges[i].edge_id});
            break;
          }
        }
      } else if(neighFrom == root.node_id){
        for(j=0;j < graph.length; j++){
          if(neighFrom == graph[j].node_id){
            neighbours.push({node_id:neighTo, root_id:root.node_id, latlng:graph[j].latlng, weight:edges[i].weight, pathLength:root.pathLength, fvalue:0, edge_id:edges[i].edge_id});
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
    for(j=0; j < closeSet.length; j++){
      if(closeSet[j].node_id == node.node_id){
        bool = true;
        break;
      }
    }
    return bool;
  },
  containsInOpenSet: function(node, openSet){
    var bool = false;
    for(m=0; m < openSet.length; m++){
      if(openSet[m].node_id == node.node_id){
        bool = true;
        break;
      }
    }
    return bool;
  },
  checkNode: function(node, openSet){
    for(n=0; n < openSet.length; n++){
      if(openSet[n].node_id == node.node_id){
        if(openSet[n].fvalue > node.fvalue){
          openSet.splice(n, 1);
          openSet.push(node);
          break;
        }
      }
    }
    return openSet;
  },
  // construct path
  getPath: function(startNode, closeSet, edges){
    var storePath = [];
    var storeSubpath = []
    var index = closeSet.length - 1;
    var current = closeSet[index];

    while(true){
      if(current.node_id == startNode.node_id){
        break;
      } else{
        storePath.push(current)
        for(i=0; i < closeSet.length; i++){
          if(current.root_id == closeSet[i].node_id){
            current = closeSet[i];
            break;
          }
        }
      }
    }
    console.log(storePath.length);

    for(i=0; i < storePath.length; i++){
      for(j=0; j < edges.length; j++) {
        if(storePath[i].edge_id == edges[j].edge_id){
          //console.log(edges[j].edge_id);
          storeSubpath.push(edges[j].sub_edges);
          break;
        }
      }
    }
    return storeSubpath;
  },
  getObject: function(str, data){
    var storePath = [];

    for(i=0; i < data.length; i++){
      var first = (data[i].replace(/[()]/g, ""));
      var edge = first.split(",").map(Number).filter(Boolean);
      //console.log(edge);
      storePath.push(edge);
    }
    return {name:str, data:storePath};
  }
};