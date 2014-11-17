var peruskartta = {
  map: undefined,
  marker: undefined,
  circle: undefined,
  defaultLocation: new L.LatLng(65.09064558256851,23.291015625),
  panned: false,
  markersFile: 'data.geojson',
  markers: [],
  
  initialize: function() {
    // initialize the map on the "map" div
    this.map = new L.Map('map');

    var tileurl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
    var basemap = new L.TileLayer(tileurl, {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        errorTileUrl: 'notfound.png'
    });

    var center = this.defaultLocation;
    // add the CloudMade layer to the map set the view to a given center and zoom
    this.map.addLayer(basemap).setView(center, 6);
    
    // observe moving to disable auto pan to location if user has moved the map
    this.map.on('movestart', function(e) {
      this.panned = true;
    }, this);

    var mapChanged = window.proxy(this, function(e) {
      var center = this.map.getCenter();
      var zoom = this.map.getZoom();

      this.setHash({center: center, zoom: zoom});
    });

    this.map.on('moveend', mapChanged);
    this.map.on('zoomend', mapChanged);

    var location = this.getHash();
    if (location.center && location.zoom) {
      this.map.setView(location.center, location.zoom);
    }

    if (window.applicationCache) {
      applicationCache.addEventListener('updateready', function() {
        console.log('App update is now ready');
        if (confirm('An update is available. Reload now?')) {
          window.location.reload();
        }
      });

      applicationCache.addEventListener('cached', function() {
        console.log('stuff has now been cached');
      }); 
    }
    
    this.positionMarkers();
    
  },
  isInLocation: function(latlng) {
    var center = this.map.getCenter();
    if (center.equals(latlng)) {
      return true;
    }
    
    return false;
  },
  addMarker: function(pos, size, popupText, icon) {
  	var opts = icon ? {icon: icon} : {};
    var marker = new L.Circle(pos, Math.pow(4, size), opts);
    if (popupText) {
    	marker.bindPopup(popupText);
    }
    this.map.addLayer(marker);

    return marker;
  },
  setHash: function(opts) {
    if (!opts) {
      this.setHash({center: this.map.getCenter(), zoom: this.map.getZoom()});
    } else {
      var hash = '#' + opts.center.lat + ',' + opts.center.lng + '/' + opts.zoom;
      document.location.hash = hash;
    }
  },
  getHash: function() {
    var hash = document.location.hash.substring(1);

    var parts = hash.split('/');
    if (parts.length < 2) {
      return {};
    }

    var center = parts[0].split(',');
    if (center.length < 2) {
      return {};
    }

    return {center: new L.LatLng(center[0], center[1]), zoom: parts[1]};
  },
  positionMarkers: function() {
    var scale = d3.scale.linear().domain([60, 65, 70]).range(['#e5f5f9', '#99d8c9', '#2ca25f']);
  	$.getJSON(this.markersFile).then(proxy(this, function(data) {
      L.geoJson(data, {
        style: function(feature) {
          var percentage = feature.properties.degree / (feature.properties.degree + feature.properties.no_degree) * 100;
          var style = {color: scale(percentage)};

          return style;
        },
        onEachFeature: function(feature, layer) {
          var percentage = feature.properties.degree / (feature.properties.degree + feature.properties.no_degree) * 100;
          layer.bindPopup(feature.properties.Maakunta + ': ' + percentage.toFixed(1) + ' %');
        }
      }).addTo(this.map);
    }), this.showError);
  },
  showError: function() {
    $('#error').removeClass('hide');
  }
}

// modified from spine.js
window.proxy = function(context, func) {
  var _this = context;
  return function() {
    return func.apply(_this, arguments);
  };
};
