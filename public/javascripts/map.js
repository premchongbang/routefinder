var lat;
var lng;

function make_map(id, cl){
    var map = L.map(id).setView([50.93491, -1.3964], 17);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        }).addTo(map);
    
    //map.locate({setView: true, maxZoom: 17});

    function onLocationFound(e) {
        var radius = e.accuracy / 2;

        L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point. latlng is " + e.latlng.lng ).openPopup();

        L.circle(e.latlng, radius).addTo(map);

        //lat = e.latlng.lat;
        //lng = e.latlng.lng;
        cl.value = e.latlng.lat;
    }

    //get current location and perfrom action
    //map.on('locationfound', onLocationFound);

    function onLocationError(e) {
        alert(e.message);
    }

    //map.on('locationerror', onLocationError);
}

function drawLine(e){
    popup
    .setLatLng(e.latlng)
    .setContent(e.latlng.toString())
    .openOn(map);
    pointList.push(new L.LatLng(e.latlng.lat.toFixed(5), e.latlng.lng.toFixed(5)));

    var firstpolyline = new L.polyline(pointList, {
                    color: 'red',
                    weight: 3,
                    opacity: 0.5,
                    smoothFactor: 1
    });
    
    firstpolyline.addTo(map);

    for(i=counter; i<pointList.length; i++){
        console.log("Lat and Lng of co-ordinates" + pointList[i].toFixed(5));
        counter += 1;
    }
}

function returnLat(){
    return lat;
}

function returnLng(){
    return lng;
}