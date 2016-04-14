
function render_map(id, cl, data){
    //var cluster = new L.MarkerClusterGroup();
    var currentPosition;
    var map = L.map(id).setView([50.93491, -1.3964], 17);

    //map.addLayer(cluster);
    
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
            addLayer();
            map.locate({setView: true, maxZoom: 17});
            map.on('locationfound', onLocationFound);
            break;
        case "PATH":
            addLayer();
            drawLine();
            //map.locate({setView: true, maxZoom: 17});
            map.on('locationfound', function(e){
                if(e.latlng){
                    cl[0].value = e.latlng;
                    currentPosition = e.latlng
                }
            });
            break;
        case "NOPATH":
            window.alert("No path found.");
            addLayer();
            map.locate({setView: true, maxZoom: 17});
            map.on('locationfound', onLocationFound);
            break;
        case "CURRENTLOCFAIL":
            addLayer();
            window.alert("Location out of bound. No near recoreded location.");
            map.locate({setView: true, maxZoom: 17});
            map.on('locationfound', onLocationFound);
            break;
        case "SHOWEVENTS":
            addLayer();
            showEvents();
            break;
        case "NOEVENTS":
            window.alert("No events registered.");
            addLayer();
            map.on('locationfound', onLocationFound);
            break;
        case "LOGIN":
            map.on('click', showLoginForm);
            break;
        case "LOGINFAIL":
            window.alert("Login Fail.");
            map.on('click', showLoginForm);
            break;
        case "LOGGEDIN":
            username = data[0].username;
            map.on('click', showForm);
            break;
        case "EVENTADDED":
            window.alert("Event successuflly added.")
            username = data[0].username;
            map.on('click', showForm);
            break;
        case "EDITEVENT":
            username = data[0].username;
            showUserEvent();
            break;
        case "NOUSEREVENT":
            window.alert("NO Events.");
            alert(data[0].username);
            map.on('click', showForm);
            break;
        case "INVALIDINPUT":
            window.alert("Invalid input or current location not found.");
            addLayer()
            map.locate({setView: true, maxZoom: 17});
            map.on('locationfound', onLocationFound);
            break;
        case "INCOMPLETEFORM":
            window.alert("Incomplete form or Invalid input or Not Logged in. Please fill in all boxes correctly.");
            username = data[0].username;
            map.on('click', showForm);
            break;
        case "INCOMPLETEFORM2":
            window.alert("Incomplete form or Invalid input. Please fill in all boxes correctly.");
            username = data[0].username;
            showUserEvent();
            break;
        case "UPDATED":
            window.alert("Event updated.");
            addLayer()
            break;
        case "DELETED":
            window.alert("Event deleted.");
            addLayer()
            break;
        case "DBFAIL":
            window.alert("Query Failed. Please try again later.");
            addLayer()
            map.locate({setView: true, maxZoom: 17});
            map.on('locationfound', onLocationFound);
            break;
    };
    
    function addLayer(){
            var searchControl = L.Control.extend({
        options: {
            position: 'topleft',
            placeholder: "Destination"
        },
        onAdd: function (map) {
            // happens after added to map
            var container = L.DomUtil.create('div', 'search-container');
            container.innerHTML = '<form method="post" action="/find_route" accept-charset="UTF-8" enctype="application/x-www-form-urlencoded">\
                                 <input type="text" name="first_loc" id= "first_loc" class="form-control input-search" style="width: auto;" value="" placeholder="Current Location">\
                                 <input type="hidden" name="hidden_first_loc" class="hidden_first_loc" value="NULL">\
                                <input type="text" name="second_loc" style="width: auto; margin-bottom: 5px; margin-top: 5px;" class="form-control input-search" value="" placeholder="Destination">\
                                <input type="hidden" name="hidden_disable_value" class="btnDisable" value="OFF">\
                                <span class="input-group-btn">\
                                    <button class="btn btn-search" style="border-radius: 12px; width: 50px; margin: 2px; background-color: #008CBA;" type="submit"> <i class="glyphicon glyphicon-search"></i></button>\
                                </span>\
                                <input type="button" id="btnDisable" class="btnDisable" value="OFF" style="background: url(images/3.png); height: 41px; width: 41px;"" onclick="toggle()">\
                            </form>';
            return container;
        }
        });
        map.addControl(new searchControl());
    }
    
    function showLoginForm(e){
        var un = "", pw = "";
        var login_temp = '<form method="post" action="/login_check">\
            <p> <label for="login_name">User Name:</label>\
            <input type="text" id= "login_name" name="login_name" value="'+ un +'"placeholder="User Name"> </p>\
            <p> <label for="password">Password :</label>\
            <input type="password" id="password" name="password" value="'+ pw +'"placeholder="Password"> </p>\
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

    function showForm(e){
        var society_event = "", society = "", date = "", des = "", venue="";

        var event_temp = '<form method="post" action="/add_event">\
            <p> <label for="event_name">Event Name:</label>\
            <input type="text" id="event_name" name="event_name" value="'+ society_event +'""> </p>\
            <p> <label for="society_name">Society :</label>\
            <input type="text" id="society_name" name="society_name" value="'+ society +'""> </p>\
            <p> <label for="date">Date :</label>\
            <input type="date" id="date" name="date" value="'+ date +'"> </p>\
            <input type="hidden" name="hidden_position" value="'+ e.latlng +'"">\
            <input type="hidden" name="hidden_username" value="'+ username +'"">\
            <p><label for="venue">Venue :</label>\
            <input type="text" id="venue" name="venue" value="'+ venue +'"></p>\
            <label for="description">Description :</label>\
            <textarea rows="4" cols="45" id="description" name="des" value="'+ des +'""> </textarea>\
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

        //get the user input values from the form
        society_event = L.DomUtil.get("event_name");
        society = L.DomUtil.get("society_name");
        date = L.DomUtil.get("date");
        des = L.DomUtil.get("description");
        venue = L.DomUtil.get("venue");
    }
    
    function removeMarker(){
        map.removeLayer(marker);
    }

    function onLocationError(e){
        alert(e.message);
    }

    // when location is found 
    function onLocationFound(e){
        L.marker(e.latlng).addTo(map)
            .bindPopup("YOU ARE HERE ").openPopup();
        if(e.latlng){
            cl[0].value = e.latlng;
            currentPosition = e.latlng
        }
    }

    // draws line in the map
    function drawLine(){
        var storeList = [];

        var path = data[0].data;

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
                smoothFactor: 2
            });

            firstpolyline.addTo(map);
        }

        //adding markers to the map
        L.marker(new L.LatLng(data[0].startNode.x, data[0].startNode.y)).addTo(map).bindPopup("START POINT").openPopup();
        L.marker(new L.LatLng(data[0].endNode.x, data[0].endNode.y)).addTo(map);
    }

    // displays the events in the map using the data set
    function showEvents(){
        var events = data[0].data;

        // adding marker with form inside pop ups
        for(i=0; i < events.length; i++){
            var event_temp = '<h1 style="text-align: center;">'+ events[i].event_title +'</h1>\
                <p> Society Name: '+ events[i].organiser +' </p>\
                <p> Date: '+ events[i].date +' </p>\
                <p> Venue: '+ events[i].venue +' </p>\
                <p> Details: '+ events[i].detail +'</p>';

            var latlng = new L.LatLng(events[i].latlng.x, events[i].latlng.y);
            marker = new L.Marker(latlng, {draggable:false});
            map.addLayer(marker);
            marker.bindPopup(event_temp).openPopup();
            //cluster.addLayer(marker);
        }
    }

    //shows user private events list
    function showUserEvent(){
        var events = data[0].data;

        // adding marker with form inside pop ups
        for(i=0; i < events.length; i++){
            //customizing date format to yyyy-mm-dd
            var tempDate = events[i].date;
            var customdate = tempDate.slice(0, 10);

            var society_event = events[i].event_title.replace(/\s/g, ""), society = events[i].organiser.replace(/\s/g, "") , date = customdate , des = events[i].detail.replace(/ +(?= )/g,''), venue=events[i].venue.replace(/\s/g, "");
            
            var event_temp = '<form method="post" action="/update_event">\
                <p> <label for="event_name">Event Name:</label>\
                <input type="text" id="event_name" name="event_name" value="'+ society_event +'""> </p>\
                <p> <label for="society_name">Society :</label>\
                <input type="text" id="society_name" name="society_name" value="'+ society +'""> </p>\
                <p> <label for="date">Date :</label>\
                <input type="date" id="date" name="date" value="'+ date +'"> </p>\
                <input type="hidden" name="hidden_username" value="'+ username +'"">\
                <input type="hidden" name="hidden_event_id" value="'+ events[i].event_id +'"">\
                <p><label for="venue">Venue :</label>\
                <input type="text" id="venue" name="venue" value="'+ venue +'"></p>\
                <label for="description">Description :</label>\
                <textarea rows="4" cols="45" id="description" name="des" value="'+ des +'"> ' + des + '</textarea>\
                <input type="submit" name="btn_action" value="Update">\
                <input type="submit" name="btn_action" value="Delete">\
                </form>';

            var latlng = new L.LatLng(events[i].latlng.x, events[i].latlng.y);
            marker = new L.Marker(latlng, {draggable:false});
            map.addLayer(marker);
            marker.bindPopup(event_temp).openPopup();

            //get the user input values from the form
            society_event = L.DomUtil.get("event_name");
            society = L.DomUtil.get("society_name");
            date = L.DomUtil.get("date");
            des = L.DomUtil.get("description");
            venue = L.DomUtil.get("venue");
        }
    }

    function getMonth(str){
        switch(str){
            case "Jan":
                return "01";
                break;
            case "Feb":
                return "02";
                break;
            case "Mar":
                return "03";
                break;
            case "Apr":
                return "04";
                break;
            case "May":
                return "05";
                break;
            case "Jun":
                return "06";
                break;
            case "Jul":
                return "07";
                break;
            case "Aug":
                return "08";
                break;
            case "Sept":
                return "09";
                break;
            case "Oct":
                return "10";
                break;
            case "Nov":
                return "11";
                break;
            case "Dec":
                return "12";
                break;
        };
    }
}