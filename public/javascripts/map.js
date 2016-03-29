
function render_map(id, cl, data){
    var map = L.map(id).setView([50.93491, -1.3964], 17);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom:15
        }).addTo(map);

    var counter = 0;
    var marker;
    var position; // store popup lat and lng position

    switch(data[0].name){
        case "NOACTION":
            map.locate({setView: true, maxZoom: 17});
            map.on('locationfound', onLocationFound);
            map.on('locationerror', onLocationError);
            break;
        case "PATH":
            drawLine(data[0].data);
            break;
        case "MATCHFOUND":
            map.on('click', showForm);
            break;
        case "LOGIN":
            map.on('click', showLoginForm);
            break;
        case "NOMATCH":
            break;
    };
    
    function showLoginForm(e) {
        var un = "", pw = "";
        var login_temp = '<form method="post" action="/event">\
            <p> <label for="login_name">User Name:</label>\
            <input type="text" id= "login_name" name="login_name" value="'+ un +'"placeholder="User Name"> </p>\
            <p> <label for="password">Password :</label>\
            <input type="password" id="password" name="password" value="'+ pw +'"placeholder="Password"> </p>\
            <input type="hidden" name="hidden_position" value="'+ e.latlng +'">\
            <p> <input type="submit" value="Login"> </p>\
            </form>';
        if(counter >= 1){
            removeMarker();
            posittion = e.latlng;
            marker = new L.Marker(e.latlng, {draggable:true});
            map.addLayer(marker);
            marker.bindPopup(login_temp).openPopup();
        } else {
            counter++;
            posittion = e.latlng;
            marker = new L.Marker(e.latlng, {draggable:true});
            map.addLayer(marker);
            marker.bindPopup(login_temp).openPopup();
        }

        un = L.DomUtil.get("login_name");
        pw = L.DomUtil.get("password");
    }

    function showForm(e) {
        var e = "", society = "", date = "", des = "";
        var event_temp = '<form method="post" action="/">\
            <p> <label for="event_name">Event Name:</label>\
            <input type="text" id="event_name" name="event_name" value="'+ e +'""> </p>\
            <p> <label for="society_name">Society :</label>\
            <input type="text" id="society_name" name="society_name" value="'+ society +'""> </p>\
            <p> <label for="date">Date :</label>\
            <input type="date" id="date" name="date" value="'+ date +'"> </p>\
            <input type="hidden" name="hidden_position" value="'+ e.latlng +'"">\
            <label for="description">Description :</label>\
            <textarea rows="4" cols="45" id="description" name="description" value="'+ des +'""> Brief Description </textarea>\
            <input type="submit" value="Submit">\
            </form>';
        if(counter >= 1){
            removeMarker();
            posittion = e.latlng;
            marker = new L.Marker(e.latlng, {draggable:true});
            map.addLayer(marker);
            marker.bindPopup(event_temp).openPopup();
        } else {
            counter++;
            posittion = e.latlng;
            marker = new L.Marker(e.latlng, {draggable:true});
            map.addLayer(marker);
            marker.bindPopup(event_temp).openPopup();
        }
        e = L.DomUtil("event_name");
        society = L.DomUtil.get('')("society_name");
        date = L.DomUtil.get("date");
        des = L.DomUtil.get("description");

    }
    
    function removeMarker(){
        map.removeLayer(marker);
    }

    function onLocationError(e) {
        alert(e.message);
    }
    function onLocationFound(e) {
        var radius = e.accuracy / 2;

        L.marker(e.latlng).addTo(map)
            .bindPopup("YOU ARE HERE").openPopup();
            cl[0].value = e.latlng;
            L.circle(e.latlng, radius).addTo(map);
    }

    function drawLine(path) {
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