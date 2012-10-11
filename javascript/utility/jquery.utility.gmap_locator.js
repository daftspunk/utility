;(function ($, window, document, undefined) {

    $.widget("utility.gmap_locator", $.utility.gmap, {
        version: '1.0',
        options: {
            bubble_on_hover: true,
            autofit_markers: true, 
            bubble_id_prefix: '#bubble_',
            container: '#browse_sidebar_content ul' // Container with locations
        },

        // Internals
        _container: null,
        _event_chain: [],
        _address_list: [], // format {lat, lng, data: { zip:0000, city:"SYDNEY" }}
        _content: { }, // format { id: 1, content: '<strong>foobar</strong>' }

        _create: function () {
            this._reset();
     
            // Call parent constructor
            $.utility.gmap.prototype._create.call(this);

            this._container = $(this.options.container);
            this.set_locations();
            this._build();
        },

        destroy: function () {
            this._reset();
            $.Widget.prototype.destroy.call(this);
        },

        _build: function() {
            var self = this

            var events = { };
            events.click = function (marker, event, data) { self.show_content(data.id, marker); };
            
            if (this.options.bubble_on_hover)
                events.mouseover = function (marker, event, data) { self.show_content(data.id, marker); };

            this.add_to_chain(function() { 
                self.add_markers(self._address_list, events); 
                if (self.options.autofit_markers)
                    self.autofit();
            });

            this.execute_chain();
        },

        _reset: function() {
            this._address_list = [];
            this._event_chain = [];
            this._content = [];
        },

        // Locations
        //

        set_locations: function() {
            var self = this;
            this._container.find('>li').each(function() {
                var address_id = $(this).data('id');
                var content_panel = $(self.options.bubble_id_prefix+address_id);
                var address_string = $(this).data('address');
                var address_latlng = $(this).data('latlng');

                var data = { 
                    id: address_id,
                    address: $(this).data('address'),
                    content: content_panel.html()
                };

                self.set_content(data.id, data.content);

                if (address_latlng) {
                    var latlng = address_latlng.split(',');
                    self.add_to_chain(self.add_location(latlng[0], latlng[1], data));
                }
                else                
                    self.add_to_chain(self.add_location_from_string(data.address, data));
            });
        },

        add_location: function(lat, lng, data) {
            this._address_list.push({lat:lat, lng:lng, data:data, tag:data.id});
            return $.Deferred().resolve();
        },

        add_location_from_string: function(string, data) {
            var self = this;
            var deferred = $.Deferred();
            this.get_latlng_from_address_string(string, function(location) {
                self.add_location(location.lat, location.lng, data);
                deferred.resolve();
            });
            return deferred;
        },

        focus_location: function(id) {
            this.show_content(id);
        },

        // Waterfall chaining
        //

        add_to_chain: function(func) {
            this._event_chain.push(func);
        },

        execute_chain: function() {
            $.waterfall.apply(this, this._event_chain).fail(function(){}).done(function(){});
        },

        // Content
        //

        set_content: function(id, content) {
            this._content[id] = { html: content };
        },

        get_content: function(id) {
            return this._content[id].html;
        },

        show_content: function(id, marker) {
            if (!marker)
                marker = this.get_marker_by_tag(id);

            this.clear_bubbles();
            this.show_bubble_at_marker(marker, this.get_content(id));
        }
    });

})( jQuery, window, document );
