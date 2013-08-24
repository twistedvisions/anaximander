// var center = [-42.880556, 147.325]
// var zoom = 6
var center = [53.24112905344493, 6.191539001464932];
var zoom = 9;

var lastResults = [];
var mapObjects = {};

var initMap = function () {
  drawMap();
  getDataAtLocation();
};

var drawMap = function () {
  var mapOptions = {
    zoom: zoom,
    center: new google.maps.LatLng(center[0], center[1]), 
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  window.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

  google.maps.event.addListener(map, 'bounds_changed', function () {
    getDataAtLocation();
  });
};

var getPosition = function () {
  var mce = map.getCenter();
  return {
    lat: mce.lat(),
    lon: mce.lng()
  };
};

var getRadius = function () {
  var bounds = map.getBounds();
  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();
  var extent_vertical = ne.lat() - sw.lat();
  var extent_horizontal = ne.lng() - sw.lng();
  var furthestExtent = extent_vertical > extent_horizontal ? extent_vertical : extent_horizontal;
  return furthestExtent / 2;
};

var getDataAtLocation = _.debounce(function () {
  var position = getPosition();
  var timeRange = getTimeRange();
  var radius = getRadius();
  var pad = function (n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
  var formatYear = function (year) {
    return pad(Math.abs(year), 4, 0);
  };
  var getStartOfYear = function (year) {
    var isBc = year < 0;
    return formatYear(year) + "-01-01" + (isBc ? " BC" : "");
  };
  var getEndOfYear = function (year) {
    var isBc = year < 0;
    return formatYear(year) + "-12-31" + (isBc ? " BC" : "");
  };
  $.get(
    "/location", 
    {
      lat: position.lat, 
      lon: position.lon, 
      radius: radius,
      start: getStartOfYear(timeRange[0]), 
      end: getEndOfYear(timeRange[1])
    }, 
    function (results) {

      var oldResultsAsKeys = _.map(lastResults, makeKey);
      var newResultsAsKeys = _.map(results, makeKey);

      var toRemove = _.difference(oldResultsAsKeys, newResultsAsKeys);
      var toRender = _.difference(newResultsAsKeys, oldResultsAsKeys);

      if (window.debug) {

        console.log("total", results.length) 
        console.log("removing", toRemove.length)
        console.log("remaining", lastResults.length - toRemove.length)       
        console.log("rendering", toRender.length)
      }

      _.each(toRemove, function (result) {
        mapObject = mapObjects[result];
        mapObject.setMap(null);
        delete mapObjects[result];
      });

      _.each(toRender, function (result) {
        
        resultObj = JSON.parse(result);
      
        var mapObject = (resultObj.location.length === 1) 
          ? drawPoint(resultObj) 
          : drawShape(resultObj);
        mapObject.setMap(map);
        mapObjects[result] = mapObject;
      });
      lastResults = results;
    }
  );
}, 500);

var makeKey = function (result) {
  var keys = _.keys(result);
  keys.sort();
  return "{" + _.map(keys, function (key) {
    var el = result[key];
    return "\"" + key + "\":" + 
      ((_.isObject(el) && !_.isDate(el) && !_.isArray(el)) ? 
        makeKey(el) : 
        JSON.stringify(el));
  }).join(",") + "}";
};

var lastInfoWindow = null;
var drawPoint = function (result) {
  var marker = new google.maps.Marker({
    title: result.person_name,
    position: new google.maps.LatLng(result.location[0][0], result.location[0][1])
  });

  google.maps.event.addListener(marker, 'mouseover', function() {
    if (lastInfoWindow) {
      lastInfoWindow.close();  
    }
    var info = new google.maps.InfoWindow({
      content: [
        "<a href='" + result.person_link + "'>" + result.event_name + "</a>",
        new Date(result.start_date).toLocaleDateString()
      ].join("<br/>")
    });
    info.open(this.map, marker);
    lastInfoWindow = info;
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

var loadMap = function () {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=" + window.googleApiKey + 
    "&sensor=false&callback=initMap";
  document.body.appendChild(script);
};

var setSummaryText = function () {

  var timeRange = getTimeRange();

  var toText = function (year, otherYear) {
    if (year < 0) {
    
      return (-year) + "BCE";
    
    } else if (otherYear && otherYear < 0) {
    
      return year + "CE";
    
    }
    return year;
  };
 
  $("#info-panel").text(toText(timeRange[0]) + " - " +
                        toText(timeRange[1], timeRange[0]));
};
var initSlider = function () {
  $(function() {
    $( "#slider-range" ).slider({
      range: true,
      min: -4000,
      max: 2013,
      values: [ 1813, 2013 ],
      slide: function( event, ui ) {
        setSummaryText();
        getDataAtLocation();
      }
    });
  });
  setSummaryText();
};

var getTimeRange = function () {
  return [$("#slider-range").slider("values", 0), 
          $("#slider-range").slider("values", 1)];
};

var init = function () {
  initSlider();
  loadMap();
};

window.onload = init;
