
function make_map(id, cl, data){
    var map = L.map(id).setView([50.93491, -1.3964], 17);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom:15
        }).addTo(map);

    //map.locate({setView: true, maxZoom: 18});

    if(data[0].name == "PATH"){
        drawLine(data[0].data);
    }

    function drawLine(path){
        var storeList = [];

        for(j=0; j < path.length; j++){
            var pointList = [];
            for(i=0; i < (path[j].length - 1); i++){
                pointList.push(new L.LatLng(path[j][i], path[j][i + 1]));
                i++;
            }
            storeList.push(pointList);
        }

        for(i=0; i < storeList.length; i++){
            var firstpolyline = new L.polyline(storeList[i], {
                color: 'red',
                weight: 3,
                opacity: 0.5,
                smoothFactor: 1
            });

            firstpolyline.addTo(map);
        }
    }
}