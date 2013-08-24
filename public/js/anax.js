// var center = [-42.880556, 147.325]
// var zoom = 6
var center = [53.24112905344493, 6.191539001464932];
var zoom = 9;

var mapObjects = [];

var initialize = function () {
  drawMap();
  getDataAtLocation(center[0], center[1]);
};

var drawMap = function () {
  var mapOptions = {
    zoom: zoom,
    center: new google.maps.LatLng(center[0], center[1]), 
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  window.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

  google.maps.event.addListener(map, 'center_changed', function () {
    var mce = map.getCenter();
    moveCenterLat = mce.lat();
    moveCenterLng = mce.lng();
    getDataAtLocation(mce.lat(), mce.lng());
  });
};

var getDataAtLocation = _.debounce(function (lat, lon) {
  $.get("/location", {lat: lat, lon: lon}, function (results) {
    _.each(mapObjects, function (mo) {
      mo.setMap(null);
    });
    mapObjects = [];

    _.each(results, function (result) {
      var mapObject = (result.location.length === 1) 
        ? drawPoint(result) 
        : drawShape(result);
      mapObject.setMap(map);
      mapObjects.push(mapObject);
    });
  });
}, 500);

var drawPoint = function (result) {
  var marker = new google.maps.Marker({
    title: result.person_name,
    position: new google.maps.LatLng(result.location[0][0], result.location[0][1])
  });

  google.maps.event.addListener(marker, 'click', function() {
    console.log(this, arguments);
    var info = new google.maps.InfoWindow({
      content: [
        result.event_name,
        new Date(result.start_date).toLocaleDateString()
      ].join("<br/>")
    });
    info.open(this.map, marker);
  });

  return marker;

};

var drawShape = function (result) {
  return new google.maps.Polygon({
    path: _.map(result.location, function (x) {
      return new google.maps.LatLng(x[0], x[1]);
    }),
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
    fillColor: "#558822",
    fillOpacity: 0.5,
    map: map
  });
};

var loadScript = function () {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyDiiFoiNcBsExYo5cb7b3qP0zteRor0bz8&sensor=false&callback=initialize";
  document.body.appendChild(script);
}

window.onload = loadScript;