var peruskartta = {
  map: undefined,
  marker: undefined,
  circle: undefined,
  defaultLocation: new L.LatLng(60.2275,24.9335),
  panned: false,
  alkosFile: 'alko-markers.json',   // must be manually fetched from http://www.alko.fi/api/store/markers?language=fi
  alkos: [],
  markerCluster: new L.MarkerClusterGroup(),
  
  initialize: function() {
    // initialize the map on the "map" div
    this.map = new L.Map('map');

    var tileurl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
    var basemap = new L.TileLayer(tileurl, {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        errorTileUrl: 'notfound.png'
    });

    this.map.addLayer(this.markerCluster);

    var center = this.defaultLocation;
    // add the CloudMade layer to the map set the view to a given center and zoom
    this.map.addLayer(basemap).setView(center, 11);

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
    
    this.positionAlkos();
    
  },
  isInLocation: function(latlng) {
    var center = this.map.getCenter();
    if (center.equals(latlng)) {
      return true;
    }
    
    return false;
  },
  addMarker: function(pos, popupText, icon) {
  	var opts = icon ? {icon: icon} : {};
    var marker = new L.Marker(pos, opts);
    if (popupText) {
    	marker.bindPopup(popupText).openPopup();
    }
    this.markerCluster.addLayer(marker);

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
  positionAlkos: function() {
  	$.getJSON(this.alkosFile).then(proxy(this, function(data) {
  		$.each(data, proxy(this, function(i, it) {
  			var alko = {
  				name: 'Alko ' + it.name,
  				address: it.address + ' ' + it.postalCode + ' ' + it.locality,
  				lat: it.latitude,
  				lng: it.longitude,
  				url: 'http://alko.fi/' + it.url
  			}
  			
  			alko.marker = this.addMarker(new L.LatLng(alko.lat,alko.lng), '<a target="_blank" href="' + alko.url + '">' + alko.name + '</a><br>' + alko.address);
  			
  			this.alkos.push(alko);
  		}));
  	}), proxy(this, function() {
  		console.log('Error fetching alkos', arguments);
  	}))
  }
}

// modified from spine.js
window.proxy = function(context, func) {
  var _this = context;
  return function() {
    return func.apply(_this, arguments);
  };
};
