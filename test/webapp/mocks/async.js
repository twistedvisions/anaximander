define(function () {
  return {
    load: function (name, req, onLoad) {
      var googleMapsString = "//maps.googleapis.com";
      if (name.substring(0, googleMapsString.length) === googleMapsString) {
        var latLng = {
          lat: function () {},
          lng: function () {}
        };

        window.google = {
          maps: {
            InfoWindow: function () {
              return {
                open: function () {}
              };
            },
            LatLng: function () {},
            LatLngBounds: function () {
              return {
                extend: function () {}
              };
            },
            Point: {},
            Marker: function () {},
            MVCObject: function () {},
            MapTypeId: {},
            Map: function () {
              return {
                getBounds: function () {
                  return {
                    getNorthEast: function () {
                      return latLng;
                    },
                    getSouthWest: function () {
                      return latLng;
                    }
                  };
                },
                getCenter: function () {
                  return latLng;
                },
                getZoom: function () {}
              };
            },
            event: {
              triggers: [],
              addListener: function (obj, event, cb) {
                this.triggers.push(cb);
              }
            }
          }
        };
        onLoad({});
      }
    }
  };
});