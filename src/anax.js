function initialize() {
  var mapOptions = {
    zoom: 6,
    center: new google.maps.LatLng(-42.880556, 147.325), 
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

  var pl = new google.maps.Polygon({
    path: _.map(path, function (x) {
      return new google.maps.LatLng(x[0], x[1]);
    }),
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2,
    fillColor: "#558822",
    fillOpacity: 0.5
  });

  pl.setMap(map);

}

function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyDiiFoiNcBsExYo5cb7b3qP0zteRor0bz8&sensor=false&callback=initialize";
  document.body.appendChild(script);
}

window.onload = loadScript;