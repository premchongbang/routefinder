 var exports = module.exports = {};

module.exports = {
  // finding the distane between two latitude and longitude point using Haversine formula
  findDistance: function(lat1, lng1, lat2, lng2){
      var deg2rad = 0.017453292519943295; // === Math.PI / 180
      var cos = Math.cos;
      lat1 *= deg2rad;
      lng1 *= deg2rad;
      lat2 *= deg2rad;
      lng2 *= deg2rad;
      var a = ((1 - cos(lat2 - lat1)) +
              (1 - cos(lng2 - lng1)) * cos(lat1) * cos(lat2)
              ) / 2;

      return 12742 * Math.asin(Math.sqrt(a)) * 1000; // Diameter of the earth in m (2 * 6371 * 1000)
  },
  checkInputValidity: function(input){
    var exceptionInput = ["2A", "44A", "58A", "B27"];
    if(this.contains(exceptionInput, input)){
      console.log("check 1");
      return true;
    } else if(!isNaN(input)){
      console.log("check 2");
      return true;
    } else {
      console.log("check 3");
      return false;
    }
  },
  contains: function(array, obj){
    for (var i = 0; i < array.length; i++) {
        if (array[i] == obj) {
            return true;
        }
    }
    return false;
  },
  getStartNode: function(startNode, graph){
    var temp = null;
    var exceptionInput = ["2A", "44A", "58A", "B27"];

    if(this.contains(exceptionInput, startNode)){
      for(i=0; i < graph.length; i++){
        if(graph[i].building_id !== null){
          var str = (graph[i].building_id).replace(/[\s]/g,"");
          if(str == startNode){
            temp = {node_id:graph[i].node_id, root_id:graph[i].node_id, latlng:graph[i].latlng, weight:0, pathLength:0, fvalue:0, edge_id:0, access_id:graph[i].access_id};
            break;
          }
        }
      }
    } else {
      for(j=0; j < graph.length; j++){
        if(graph[j].building_id == parseInt(startNode)){
          temp = {node_id:graph[j].node_id, root_id:graph[j].node_id, latlng:graph[j].latlng, weight:0, pathLength:0, fvalue:0, edge_id:0, access_id:graph[j].access_id};
          break;
        }
      }
    }

    if(temp == null){
      return null;
    } else {
      return temp;
    }
  }, // returns the node that is closest to the current co-ordinate
  getCurrentStartNode: function(list, lat, lng){
    var temp;

    if(list.length > 1) {
      for(i=0; i < (list.length - 1); i++){
        var item1 = this.findDistance(lat, lng, list[i].latlng.x, list[i].latlng.y);
        var item2 = this.findDistance(lat, lng, list[i + 1].latlng.x, list[i + 1].latlng.y);
        console.log(item1 + " " + list[i].node_id +" " + item2 +" "+ list[i +1].node_id);
        if(this.compare(item1, item2)){
          temp = list[i];
        } else {
          temp = list[i + 1];
        }
      }

      temp = {node_id:temp.node_id, root_id:temp.node_id, latlng:temp.latlng, weight:0, pathLength:0, fvalue:0, edge_id:0, access_id:temp.access_id};

    } else {
      temp = {node_id:list[0].node_id, root_id:list[0].node_id, latlng:list[0].latlng, weight:0, pathLength:0, fvalue:0, edge_id:0, access_id:list[0].access_id};
    }
    console.log(temp.node_id);
    return temp;
  }, //gets the nearest building node attribute
  getEndNode: function(startNode, endNode, access, graph){
    var temp;
    var store = []; // stores all the entrace to the destination building
    var exceptionInput = ["2A", "44A", "58A", "B27"];

    if(access == "ON"){
      if(this.contains(exceptionInput, endNode)){
        for(i=0; i < graph.length; i++){
          if(graph[i].building_id !== null){
            var str = (graph[i].building_id).replace(/[\s]/g,"");
            if(str == endNode && graph[i].access_id == 1){
              store.push(graph[i]);
            }
          }
        }
      } else {
        for(j=0; j < graph.length; j++){
          if(graph[j].building_id == parseInt(endNode) && graph[j].access_id == 1){
            store.push(graph[j]);
          }
        }
      }
    } else {
      if(this.contains(exceptionInput, endNode)){
        for(i=0; i < graph.length; i++){
          if(graph[i].building_id !== null){
            var str = (graph[i].building_id).replace(/[\s]/g,"");
            if(str == endNode){
              store.push(graph[i]);
            }
          }
        }
      } else {
        for(j=0; j < graph.length; j++){
          if(graph[j].building_id == parseInt(endNode)){
            store.push(graph[j]);
          }
        }
      }
    }

    if(store.length >= 1){
      temp = this.getCurrentStartNode(store, startNode.latlng.x, startNode.latlng.y);
      return temp;
    } else {
      return null;
    }
  },// returns true of item1 is less than item2
  compare: function(item1, item2){
    if(item1 < item2){
      return true;
    } else {
      return false;
    }
  },
  // returns nodes with lowest fvalue
  getSuccessor: function(setItems, destNode){
    var temp;
    var temp2;
    var setLen = setItems.length;
    
    if(setLen > 2){
      for(i=0; i < (setLen - 1); i++){
        if(setItems[i].node_id == destNode.node_id){
          return setItems[i];
        } else{
          temp = this.customComparator(setItems[i], setItems[i + 1]);
          if(i < 1){
            temp2 = temp;
          } else {
            temp2 = this.customComparator(temp, temp2);
          }
        }
      }
      return temp2;
    } else if(setLen == 2){
      return this.customComparator(setItems[0], setItems[1]);
    } else {
      return setItems[0];
    }
  }, // compare fvalue and use weight instead of fvalue when dealing with starting node neighbouring nodes
  customComparator: function(item1, item2){
    if(item1.fvalue == 0 && item2.fvalue == 0){
      if(item1.weight < item2.weight){
        return item1;
      } else {
        return item2;
      }
    } else {
      if(item1.fvalue < item2.fvalue){
        return item1;
      } else {
        return item2;
      }
    }
  }, // stores current vertex neighbours and returns
  getNeigh: function(graph, edges, root){
    var neighbours = [];
    // stores the starting vertex
    for(i=0; i < edges.length; i++){
      var neighTo = edges[i].to_node;
      var neighFrom = edges[i].from_node;
      if(neighTo == root.node_id){
        for(j=0;j < graph.length; j++){
          if(neighFrom == graph[j].node_id){
            neighbours.push({node_id:neighFrom, root_id:root.node_id, latlng:graph[j].latlng, weight:edges[i].weight, pathLength:root.pathLength, fvalue:0, edge_id:edges[i].edge_id, access_id:graph[j].access_id});
            break;
          }
        }
      } else if(neighFrom == root.node_id){
        for(k=0;k < graph.length; k++){
          if(neighTo == graph[k].node_id){
            neighbours.push({node_id:neighTo, root_id:root.node_id, latlng:graph[k].latlng, weight:edges[i].weight, pathLength:root.pathLength, fvalue:0, edge_id:edges[i].edge_id, access_id:graph[k].access_id});
            break;
          }
        }
      }
    }

    return neighbours;
  }, // check for start node being reevaluated and return false if true
  checkForStartNode: function(current, startNode){
    if(current.node_id == startNode.node_id){
      if(current.pathLength == 0){
          return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }, // get the actual cost of path using weights
  findG: function(root, neigh){
    return root.pathLength + neigh.weight;
  },// find distance between two latitude na longitude points
  findH: function(neigh, dest){
    return this.findDistance(neigh.latlng.x, neigh.latlng.y, dest.latlng.x, dest.latlng.y);
  }, // checks if node contains in a list and return boolean
  containsInSet: function(node, set){
    var bool = false;
    for(m=0; m < set.length; m++){
      if(set[m].node_id == node.node_id){
        bool = true;
        break;
      }
    }
    return bool;
  }, // checks if list contains any node with higher fvalue than the given node and return boolean
  checkNode: function(node, set){
    for(n=0; n < set.length; n++){
      if(set[n].node_id == node.node_id){
        if(set[n].fvalue > node.fvalue){
          set.splice(n, 1);
          break;    
        }
      }
    }
    return set;
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

    for(i=0; i < storePath.length; i++){
      for(j=0; j < edges.length; j++) {
        if(storePath[i].edge_id == edges[j].edge_id){
          console.log("selected " + edges[j].edge_id);
          storeSubpath.push(edges[j].sub_edges);
          break;
        }
      }
    }
    return storeSubpath;
  },// sotres path in an array and return object
  getObject: function(str, data, startNode, endNode){
    var storePath = [];

    for(i=0; i < data.length; i++){
      var first = (data[i].replace(/[()]/g, ""));
      var edge = first.split(",").map(Number).filter(Boolean);
      storePath.push(edge);
    }
    return {name:str, data:storePath, startNode:startNode.latlng, endNode:endNode.latlng};
  },
  checkDate: function(date){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    var chunk = date.split("-");

    var bool = false;

    if(chunk[0] >= yyyy){
      if(chunk[1] >= mm){
        if(chunk[2] >= dd){
          bool = true;
        }
      } 
    }

    return bool;
  }
};