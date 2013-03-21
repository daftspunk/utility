;(function ($, window, document, undefined) {

	$.widget("utility.gmap_locator", $.utility.gmap, {
		version: '2.0.0',
		options: {
			on_show_content: null,        // Callback for when a location bubble is displayed
			bubble_on_hover: true,        // Show the location bubble when a marker is hovered
			autofit_markers: true,        // Autofit the map canvas to all the markers
			cleanup_markers: true,        // Remove unused markers when updating the locations
			use_marker_animation: true,   // Show marker animation when updating locations
			bubble_id_prefix: '#bubble_', // Element to look for with the bubble content (prefix+id)
			container: '#locations ul'    // Container with locations
		},

		// Internals
		_is_built: false,
		_container: null,
		_event_chain: [],
		_address_list: [],    // format {lat, lng, data: { zip:0000, city:"SYDNEY" }}
		_content: { },        // format { id: 1, content: '<strong>foobar</strong>' }
		_animation_obj: null,

		_create: function () {
			this._reset();
	 
			if (this.options.use_marker_animation)
				this._animation_obj = { animation: google.maps.Animation.DROP };

			// Call parent constructor
			$.utility.gmap.prototype._create.call(this);

			this._container = $(this.options.container);
			this.setLocations();
			this._build();
		},

		destroy: function () {
			this._reset();
			$.Widget.prototype.destroy.call(this);
		},

		_build: function() {
			var self = this;

			var events = { };
			events.click = function (marker, event, data) { self.showContent(data.id, marker); };
			
			if (this.options.bubble_on_hover)
				events.mouseover = function (marker, event, data) { self.showContent(data.id, marker); };

			this._add_to_chain(function() { 
				// Only execute if there are some actual addresses
				if (self._address_list.length <= 0)
					return;

				if (self._is_built)
					self.updateMarkers(self._address_list, events, self._animation_obj, self.options.cleanup_markers); 
				else
					self.addMarkers(self._address_list, events); 

				if (self.options.autofit_markers)
					self.autofit();

				self._is_built = true;
			});

			this._execute_chain();
		},

		_reset: function() {
			this._container = $(this.options.container);
			this._address_list = [];
			this._event_chain = [];
			this._content = [];
		},

		rebuild: function() {
			this._reset();
			this.setLocations();
			this._build();
		},

		// Locations
		//

		setLocations: function() { var self = this;
			this._container.find('>li').each(function() {
				var addressId = $(this).data('id');
				var contentPanel = $(self.options.bubble_id_prefix + addressId);
				var addressString = $(this).data('address');
				var addressLatLng = $(this).data('latlng');
				var addressIcon = $(this).data('icon');

				var data = { 
					id: addressId,
					address: addressString,
					content: contentPanel.html(),
					icon: addressIcon
				};

				// Prevent duplication
				contentPanel.remove();

				self.setContent(data.id, data.content);

				if (addressLatLng && addressLatLng != "," && addressLatLng != "") {
					var latlng = addressLatLng.split(',');
					self._add_to_chain(self._add_location(latlng[0], latlng[1], data));
				}
				else if (data.address) {					
					self._add_to_chain(self._add_location_from_string(data.address, data));
				}
			});
		},

		addLocation: function(lat, lng, data) { var self = this;
			if (!data.id)
				return;

			var contentPanel = $(self.options.bubble_id_prefix + data.id);
			contentPanel.remove();

			self.setContent(data.id, data.content);

			var addressObj = { latLng:[lat,lng], data:data, id:data.id };

			if (data.icon)
				addressObj.options = { icon: data.icon };

			self.updateMarker(addressObj, null, self._animation_obj);
		},

		_add_location: function(lat, lng, data) {
			var addressObj = { latLng:[lat,lng], data:data, id:data.id };

			if (data.icon)
				addressObj.options = { icon: data.icon };

			this._address_list.push(addressObj);
			return $.Deferred().resolve();
		},

		_add_location_from_string: function(string, data) {
			var self = this;
			var deferred = $.Deferred();
			this.getLatLngFromAddressString(string, { 
				callback: function(location) {
					self._add_location(location.lat, location.lng, data);
					deferred.resolve();
				}
			});
			return deferred;
		},

		focusLocation: function(id) {
			this.showContent(id);
		},

		// Waterfall chaining
		//

		_add_to_chain: function(func) {
			this._event_chain.push(func);
		},

		_execute_chain: function() {
			$.waterfall.apply(this, this._event_chain).fail(function(){}).done(function(){});
		},

		// Content
		//

		setContent: function(id, content) {
			this._content[id] = { html: content };
		},

		getContent: function(id) {
			return this._content[id].html;
		},

		showContent: function(id, marker) {            
			if (!marker)
				marker = this.getMarkerById(id);

			this.options.on_show_content && this.options.on_show_content(id, marker);
			this.element.trigger('show_content.gmap_locator', [id, marker]);

			this.clearBubbles();
			this.showBubbleAtMarker(marker, this.getContent(id));
		}
	});

})( jQuery, window, document );
