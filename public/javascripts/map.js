
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
    var username;

    switch(data[0].name){
        case "NOACTION":
            map.locate({setView: true, maxZoom: 17});
            map.on('locationfound', onLocationFound);
            //map.on('locationerror', onLocationError);
            break;
        case "PATH":
            drawLine(data[0].data);
            break;
        case "MATCHFOUND":
            username = data[0].data[0].username;
            map.on('click', showForm);
            break;
        case "LOGIN":
            map.on('click', showLoginForm);
            break;
        case "SHOWEVENTS":
            showEvents(data[0].data);
            break;
        case "NOMATCH":
            break;
        case "INCOMPLETEFORM":
            break;
        case "NOEVENTS":
            break;
        case "DBFAIL":
            break;
    };
    
    function showLoginForm(e) {
        var un = "", pw = "";
        var login_temp = '<form method="post" action="/login_check">\
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
        var society_event = "", society = "", date = "", des = "";
        var event_temp = '<form method="post" action="/add_event">\
            <p> <label for="event_name">Event Name:</label>\
            <input type="text" id="event_name" name="event_name" value="'+ society_event +'""> </p>\
            <p> <label for="society_name">Society :</label>\
            <input type="text" id="society_name" name="society_name" value="'+ society +'""> </p>\
            <p> <label for="date">Date :</label>\
            <input type="date" id="date" name="date" value="'+ date +'"> </p>\
            <input type="hidden" name="hidden_position" value="'+ e.latlng +'"">\
            <input type="hidden" name="hidden_username" value="'+ username +'"">\
            <label for="description">Description :</label>\
            <textarea rows="4" cols="45" id="description" name="des" value="'+ des +'""> Brief Description </textarea>\
            <input type="submit" value="Submit">\
            </form>';
        if(counter >= 1){
            removeMarker();
            marker = new L.Marker(e.latlng, {draggable:true});
            map.addLayer(marker);
            marker.bindPopup(event_temp).openPopup();
        } else {
            counter++;
            marker = new L.Marker(e.latlng, {draggable:true});
            map.addLayer(marker);
            marker.bindPopup(event_temp).openPopup();
        }

        society_event = L.DomUtil.get("event_name");
        society = L.DomUtil.get("society_name");
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
            .bindPopup("YOU ARE HERE ").openPopup();
        if(e.latlng){
            cl[0].value = e.latlng;
        }
        //L.circle(e.latlng, radius).addTo(map);
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

    function showEvents(events){
        for(i=0; i < events.length; i++){
            var event_temp = '<h1 style="text-align: center;"> <label>'+ events[i].event_name +'</label> </h1>\
                <p> <label> Society Name: '+ events[i].society_name +'</label> </p>\
                <p> <label> Date: '+ events[i].date +'</label> </p>\
                <p> <label> Details: '+ events[i].detail +'</label> </p>'

            var latlng = new L.LatLng(events[i].latlng.x, events[i].latlng.y);
            marker = new L.Marker(latlng, {draggable:false});
            map.addLayer(marker);
            marker.bindPopup(event_temp).openPopup();
        }
    }
}