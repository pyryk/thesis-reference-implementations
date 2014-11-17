var peruskartta = {
  map: undefined,
  marker: undefined,
  circle: undefined,
  defaultLocation: new L.LatLng(60.2275,24.9335),
  panned: false,
  markersFile: 'reittiopas-data.json',
  markerImportances: [1, 0.2],
  extrasFile: 'voting.json',
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
    this.map.addLayer(basemap).setView(center, 11);
    
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
    var dots = $.getJSON(this.markersFile);
    dots.then(proxy(this, function(results) {
      var start = new Date().getTime();
      var dots = results;

      // assume step is identical for all data
      var latStep = getStep(dots, 'lat');
      var lngStep = getStep(dots, 'lng');

      dots.map(proxy(this, function(dot) {
        var northWest = L.latLng(
            dot['lat'] - latStep / 2,
            dot['lng'] - lngStep / 2);
        var southEast = L.latLng(
            dot['lat'] + latStep / 2,
            dot['lng'] + lngStep / 2);
        var coords = L.latLngBounds(northWest,southEast);

        var value = dot.time;
        var color = scale(value);

        var rect = L.rectangle(coords.pad(0.01), {color: color, opacity: 0, fillOpacity: 0.5, weight: 1})
                .bindPopup('Average travel time: ' + value.toFixed(2) + ' min')
                .addTo(this.map);
        this.markers.push(rect);
      }));
    }), this.showError);
  	
  },
  showError: function() {
    $('#error').removeClass('hide');
  }
}

function scale(value) {
    // todo improve: normalize scales somehow
    var colors = [
      {maxTime: 30, color: 'green'},
      {maxTime: 40, color: 'yellowgreen'},
      {maxTime: 50, color: 'yellow'},
      {maxTime: 60, color: 'orange'},
      {maxTime: 80, color: 'red'},
      {maxTime: 100, color: 'purple'},
      {maxTime: 120, color: 'blue'}
    ];



    function getColor(time) {
      for(var i in colors) {
        if (time <= colors[i].maxTime) {
          return colors[i].color;
        }
      }

      return _.last(colors).color;
    }

    return getColor(value);
  }

function getStep(data, type) {
  if (type == 'lat') {
    var index = 'lat';
    var isSorted = true;
  } else {
    var index = 'lng';
    var isSorted = false;
  }

  var values = _.chain(data).map(function(it) { return it[index]; }).uniq(isSorted).value();
  return Math.abs((_.last(values) - _.first(values)) / values.length);
}

// modified from spine.js
window.proxy = function(context, func) {
  var _this = context;
  return function() {
    return func.apply(_this, arguments);
  };
};
