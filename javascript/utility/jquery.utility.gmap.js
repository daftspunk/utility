;(function ($, window, document, undefined) {

    $.widget("utility.gmap", {
        version: '1.0',
        options: {
            start_position: [-34.397, 150.644], // Australia ;)
            start_zoom: 2,                      // Initial map zoom
            
            allow_drag: true,                   // Allow user to drag map
            allow_scrollwheel: true,                 // Allow mouse scrool to zoom
            alow_dbl_click_zoom: true,          // Allow double click to zoom

            show_default_ui: false,             // Show default map controls
            show_pan_ui: false,                 // Show UI for pan
            show_type_ui: false,                // Show UI for type
            show_scale_ui: false,               // Show UI for scale
            show_overview_ui: false,            // Show UI for overview
            show_street_view_ui: false,         // Show UI for street view

            zoom_ui: false,                     // Show UI for zoom
            zoom_ui_position: 'top right',      // Zoom UI Position
            zoom_ui_size: 'default',            // Zoom size (default, large, small)
            on_idle: null,                      // This is triggered when the map is changed

            distance_type:'km',                 // Calculate distance in Kilometers (km) or Miles (mi)
            circle_colour:'#ff0000',            // Circle color
            marker_image: null,                 // Custom image for marker

            bubble_min_width: 20,
            bubble_padding: 0
        },

        // Internals
        _map: null, // Google Map object
        _cluster_rules: { },

        _create: function () {

            if (typeof google == 'undefined')
                throw "Google maps API not found. Please check that you are connected to the internet.";

            var map_options = {
                zoom: this.options.start_zoom,
                center: new google.maps.LatLng(this.options.start_position[0], this.options.start_position[1]),

                disableDefaultUI: !this.options.show_default_ui,
                panControl: this.options.show_pan_ui,
                mapTypeControl: this.options.show_type_ui,
                scaleControl: this.options.show_scale_ui,
                streetViewControl: this.options.show_overview_ui,
                overviewMapControl: this.options.show_street_view_ui,
                draggable: this.options.allow_drag,
                scrollwheel: this.options.allow_scrollwheel,
                keyboardShortcuts: false,
                disableDoubleClickZoom: !this.options.alow_dbl_click_zoom,

                zoomControl: this.options.zoom_ui,
                zoomControlOptions: { 
                    style: google.maps.ZoomControlStyle.SMALL,
                    position: this._get_control_position(this.options.zoom_ui_position)
                },
            
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };     

            var map_defaults = {
                unit: this.options.distance_type,
                classes: {
                    InfoWindow: InfoBubble
                }
            };

            if (this.element)
                this._call_action('destroy');

            this.element.gmap3({ 
                action:'init', 
                options:map_options, 
                events: {
                    idle: $.proxy(function() { this.options.on_idle && this.options.on_idle(); }, this)
                }
            });

            // Must not be cast against element
            $().gmap3('setDefault', map_defaults);

            // Get Google map object
            this._map = this._call_action('get', { name: 'map' });
        },

        destroy: function () {
            if (this.element)
                this._call_action('destroy');
            
            $.Widget.prototype.destroy.call(this);
        },

        // General map functions
        //

        _get_control_position: function(pos_string) {
            var pos_return;

            switch (pos_string) {
                case "top center":
                    pos_return = google.maps.ControlPosition.TOP_CENTER
                    break;
                case "top left":
                    pos_return = google.maps.ControlPosition.TOP_LEFT
                    break;
                case "top right":
                    pos_return = google.maps.ControlPosition.TOP_RIGHT
                    break;
                case "left top":
                    pos_return = google.maps.ControlPosition.LEFT_TOP
                    break;
                case "right top":
                    pos_return = google.maps.ControlPosition.RIGHT_TOP
                    break;
                case "left center":
                    pos_return = google.maps.ControlPosition.LEFT_CENTER
                    break;
                case "right center":
                    pos_return = google.maps.ControlPosition.RIGHT_CENTER
                    break;
                case "left bottom":
                    pos_return = google.maps.ControlPosition.LEFT_BOTTOM
                    break;
                case "right bottom":
                    pos_return = google.maps.ControlPosition.RIGHT_BOTTOM
                    break;
                case "bottom center":
                    pos_return = google.maps.ControlPosition.BOTTOM_CENTER
                    break;
                case "bottom left":
                    pos_return = google.maps.ControlPosition.BOTTOM_LEFT
                    break;
                case "bottom right":
                    pos_return = google.maps.ControlPosition.BOTTOM_RIGHT
                    break;

            }
            return pos_return;
        },


        _call_action: function(action, options) {
            return this.element.gmap3($.extend(true, {action: action}, options));
        },

        get_latlng_object: function(lat, lng) {
            return new google.maps.LatLng(lat, lng);
        },

        // Canvas
        // 

        set_center: function(lat, lng) {
            this._map.setCenter(this.get_latlng_object(lat, lng));
        },

        set_zoom: function(zoom) {
            if (!zoom) return;
            this._map.setZoom(zoom);            
        },

        // Autofit to elements
        autofit: function() {
            this._call_action('autofit');
        },

        get_canvas_radius: function() {
            var bounds = this._map.getBounds();
            var center = bounds.getCenter();
            var ne = bounds.getNorthEast();

            // r = radius of the earth in statute miles
            var r = (this.options.distance_type == "km") ? 6378.1370 : 3963.191;  

            // Convert lat or lng from decimal degrees into radians (divide by 57.2958)
            var lat1 = center.lat() / 57.2958; 
            var lon1 = center.lng() / 57.2958;
            var lat2 = ne.lat() / 57.2958;
            var lon2 = ne.lng() / 57.2958;

            // distance = circle radius from center to Northeast corner of bounds
            var distance = r 
                * Math.acos(Math.sin(lat1) 
                * Math.sin(lat2) 
                + Math.cos(lat1) 
                * Math.cos(lat2) 
                * Math.cos(lon2 - lon1));

            return distance;
        },

        // Address lookups
        //

        // Lookup, Returns array
        get_object_from_address_string: function(string, callback, options) {
            this._call_action('getAddress', $.extend(true, {address: string, callback:callback}, options));
        },

        // Lookup, Returns object
        get_latlng_from_address_string: function(string, callback, options) {
            var self = this;
            this.get_object_from_address_string(string, function(address) {
                var result = { lat:false, lng: false }; 
                if (address[0])
                    result = self.get_latlng_from_address_object(address[0]);

                callback && callback(result);
            }, options);
        },

        // Filter, Returns object {lat,lng}
        get_latlng_from_address_object: function(address_object, callback, options) {
            var result = { lat:false, lng: false };
            if (address_object.geometry && address_object.geometry.location) {
                result = { 
                    lat: address_object.geometry.location.lat(), 
                    lng: address_object.geometry.location.lng() 
                };
            }
            callback && callback(result);
            return result;
        },

        // Markers
        //

        // Array format [{lat:1, lng:1, tag: 'address_1', data: { zip:0000, city:"SYDNEY" }}]
        add_markers: function(markers_array, marker_events) {
            var self = this;
            
            // Events
            var marker_events = $.extend(true, {
                click: function(marker, event, data) { },
                mouseover: function(marker, event, data) { },
                mouseout: function() { }
            }, marker_events);

            // Options
            var marker_options = {
                markers: markers_array,
                marker: {
                    options: { 
                        draggable: false,
                        marker_image: this.options.marker_image
                    },
                    events: marker_events
                }
            };

            // Clustering
            marker_options = $.extend(true, marker_options, this.get_cluster_rules());

            this._call_action('addMarkers', marker_options);
        },

        get_markers: function() {
            return this._call_action('get', { name:'marker', all:true });
        },

        get_markers_by_tag: function(tag) {
            return this._call_action('get', { name:'marker', all:true, tag:tag });
        },

        get_marker_by_tag: function(tag) {
            return this._call_action('get', { name:'marker', first:true, tag:tag });
        },

        get_visible_markers: function() {
            var markers = this.get_markers();
            for (var i = markers.length, bounds = this._map.getBounds(); i--;) {
                if (bounds.contains(markers[i].getPosition())) {
                    // TODO:
                    alert('found '+i);
                }
            }
        },

        // Clusters
        //

        get_cluster_rules: function() {
            return (!$.isEmptyObject(this._cluster_rules)) 
                ? { clusters: this._cluster_rules } 
                : { };
        },

        add_cluster_rule: function(number, width, height, css_class) {
            this._cluster_rules[number] = {
                content: '<div class="cluster cluster-'+number+' '+css_class+'">CLUSTER_COUNT</div>',
                width: width,
                height: height
            };
        },

        // Bubbles
        //

        show_bubble_at_marker: function(marker, content) {
            var position = marker.getPosition();
            this.show_bubble_at_latlng(position.lat(), position.lng(), content);

            infowindow = this._call_action('get', { name:'infowindow' });
            infowindow.open(this._map, marker);
        },

        show_bubble_at_latlng: function(lat, lng, content) {
            this._call_action('addInfowindow', {
                latLng: this.get_latlng_object(lat,lng),
                content: content,
                minWidth: this.options.bubble_min_width,
                padding: this.options.bubble_padding
            });
        },

        clear_bubbles: function() {
            this._call_action('clear', {name:'infowindow'});
        },

        // Overlay
        //

        show_overlay_at_marker: function(marker, content) {
            var position = marker.getPosition();
            this.show_overlay_at_latlng(position.lat(), position.lng(), content);
        },

        show_overlay_at_latlng: function(lat, lng, content) {
            this._call_action('addOverlay', {
                latLng: this.get_latlng_object(lat,lng),
                content: content
            });
        },

        clear_overlays: function() {
            this._call_action('clear', {name:'overlay'});
        },

        // Circle
        //

        show_circle_at_marker: function(marker, radius) {
            var position = marker.getPosition();
            this.show_circle_at_latlng(position.lat(), position.lng(), radius);
        },

        show_circle_at_latlng: function(lat, lng, radius) {
            this._call_action('addCircle', {
                options: {
                    center: [lat, lng],
                    radius: radius,
                    fillColor : "#FFAF9F",
                    strokeColor : "#FF512F"
                }
            });            
        },

        clear_circles: function() {
            this._call_action('clear', {name:'overlay'});
        }

    })

})( jQuery, window, document );


/*
 *  GMAP3 Plugin for JQuery 
 *  Version   : 4.1
 *  Date      : 2011-11-18
 *  Licence   : GPL v3 : http://www.gnu.org/licenses/gpl.html  
 *  Author    : DEMONTE Jean-Baptiste
 *  Contact   : jbdemonte@gmail.com
 *  Web site  : http://gmap3.net
 *   
 *  Copyright (c) 2010-2011 Jean-Baptiste DEMONTE
 *  All rights reserved.
 *   
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 * 
 *   - Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   - Redistributions in binary form must reproduce the above 
 *     copyright notice, this list of conditions and the following 
 *     disclaimer in the documentation and/or other materials provided 
 *     with the distribution.
 *   - Neither the name of the author nor the names of its contributors 
 *     may be used to endorse or promote products derived from this 
 *     software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
 * POSSIBILITY OF SUCH DAMAGE.
 */
 
 (function ($) {
    
    /***************************************************************************/
    /*                                STACK                                    */
    /***************************************************************************/
    function Stack (){
        var st = [];
        this.empty = function (){
            for(var i = 0; i < st.length; i++){
                if (st[i]){
                    return false
                }
            }
            return true;
        }
        this.add = function(v){
            st.push(v);
        }
        this.addNext = function ( v){
            var t=[], i, k = 0;
            for(i = 0; i < st.length; i++){
                if (!st[i]){
                    continue;
                }
                if (k == 1) {
                    t.push(v);
                }
                t.push(st[i]);
                k++;
            }
            if (k < 2) {
                t.push(v);
            }
            st = t;
        }
        this.get = function (){
            for(var i = 0; i < st.length; i++){
                if (st[i]) {
                    return st[i];
                }
            }
            return false;
        }
        this.ack = function (){
            for(var i = 0; i < st.length; i++){                     
                if (st[i]) {
                    delete st[i];
                    break;
                }
            }
            if (this.empty()){
                st = [];
            }
        }
    }
    
    /***************************************************************************/
    /*                                STORE                                    */
    /***************************************************************************/
    function Store(){
        var store = {};
        
        /**
         * add a mixed to the store
         **/
        this.add = function(name, obj, todo){
            name = name.toLowerCase();
            if (!store[name]){
                store[name] = [];
            }
            store[name].push({obj:obj, tag:ival(todo, 'tag')});
            return name + '-' + (store[name].length-1);
        }
        
        /**
         * return a stored mixed
         **/
        this.get = function(name, last, tag){
            var i, idx, add;
            name = name.toLowerCase();
            if (!store[name] || !store[name].length){
                return null;
            }
            idx = last ? store[name].length : -1;
            add = last ? -1 : 1;
            for(i=0; i<store[name].length; i++){
                idx += add;
                if (store[name][idx]){
                    if (tag !== undefined) {
                        if ( (store[name][idx].tag === undefined) || ($.inArray(store[name][idx].tag, tag) < 0) ){
                            continue;
                        }
                    }
                    return store[name][idx].obj;
                }
            }
            return null;
        }
        
        /**
         * return all stored mixed
         **/
        this.all = function(name, tag){
            var i, result = [];
            name = name.toLowerCase();
            if (!store[name] || !store[name].length){
                return result;
            }
            for(i=0; i<store[name].length; i++){
                if (!store[name][i]){
                    continue;
                }
                if ( (tag !== undefined) && ( (store[name][i].tag === undefined) || ($.inArray(store[name][i].tag, tag) < 0) ) ){
                    continue;
                }
                result.push(store[name][i].obj);
            }
            return result;
        }
        
        /**
         * return all storation groups
         **/
        this.names = function(){
            var name, result = [];
            for(name in store){
                result.push(name);
            }
            return result;
        }
        
        /**
         * return an object from its reference
         **/
        this.refToObj = function(ref){
            ref = ref.split('-'); // name - idx
            if ((ref.length == 2) && store[ref[0]] && store[ref[0]][ref[1]]){
                return store[ref[0]][ref[1]].obj;
            }
            return null;
        }
        
        /**
         * remove one object from the store
         **/
        this.rm = function(name, tag, pop){
            var idx, i, tmp;
            name = name.toLowerCase();
            if (!store[name]) {
                return false;
            }
            if (tag !== undefined){
                if (pop){
                    for(idx = store[name].length - 1; idx >= 0; idx--){
                        if ( (store[name][idx] !== undefined) && (store[name][idx].tag !== undefined) && ($.inArray(store[name][idx].tag, tag) >= 0) ){
                            break;
                        }
                    }
                } else {
                    for(idx = 0; idx < store[name].length; idx++){
                        if ( (store[name][idx] !== undefined) && (store[name][idx].tag !== undefined) && ($.inArray(store[name][idx].tag, tag) >= 0) ){
                            break;
                        }
                    }
                }
            } else {
                idx = pop ? store[name].length - 1 : 0;
            }
            if ( !(idx in store[name]) ) {
                return false;
            }
            // Google maps element
            if (typeof(store[name][idx].obj.setMap) === 'function') {
                store[name][idx].obj.setMap(null);
            }
            // jQuery
            if (typeof(store[name][idx].obj.remove) === 'function') {
                store[name][idx].obj.remove();
            }
            // internal (cluster)
            if (typeof(store[name][idx].obj.free) === 'function') {
                store[name][idx].obj.free();
            }
            delete store[name][idx].obj;
            if (tag !== undefined){
                tmp = [];
                for(i=0; i<store[name].length; i++){
                    if (i !== idx){
                        tmp.push(store[name][i]);
                    }
                }
                store[name] = tmp;
            } else {
                if (pop) {
                    store[name].pop();
                } else {
                    store[name].shift();
                }
            }
            return true;
        }
        
        /**
         * remove objects from the store
         **/
        this.clear = function(list, last, first, tag){
            var k, i, name;
            if (!list || !list.length){
                list = [];
                for(k in store){
                    list.push(k);
                }
            } else {
                list = array(list);
            }
            for(i=0; i<list.length; i++){
                if (list[i]){
                    name = list[i].toLowerCase();
                    if (!store[name]){
                        continue;
                    }
                    if (last){
                        this.rm(name, tag, true);
                    } else if (first){
                        this.rm(name, tag, false);
                    } else {
                        // all
                        while (this.rm(name, tag, false));
                    }
                }
            }
        }
    }
    
    /***************************************************************************/
    /*                              CLUSTERER                                  */
    /***************************************************************************/

    function Clusterer(){
        var markers = [], events=[], stored=[], latest=[], redrawing = false, redraw;
        
        this.events = function(){
            for(var i=0; i<arguments.length; i++){
                events.push(arguments[i]);
            }
        }
        
        this.startRedraw = function(){
            if (!redrawing){
                redrawing = true;
                return true;
            }
            return false;
        }
        
        this.endRedraw = function(){
            redrawing = false;
        }
        
        this.redraw = function(){
            var i, args = [], that = this; 
            for(i=0; i<arguments.length; i++){
                args.push(arguments[i]);
            }
            if (this.startRedraw){
                redraw.apply(that, args);
                this.endRedraw();
            } else {
                setTimeout(function(){
                        that.redraw.apply(that, args);
                    },
                    50
                );
            }
        };
        
        this.setRedraw = function(fnc){
            redraw  = fnc;
        }
        
        this.store = function(data, obj, shadow){
            stored.push({data:data, obj:obj, shadow:shadow});
        }
        
        this.free = function(){
            for(var i = 0; i < events.length; i++){
                google.maps.event.removeListener(events[i]);
            }
            events=[];
            this.freeAll();
        }
        
        this.freeIndex = function(i){
            if (typeof(stored[i].obj.setMap) === 'function') {
                stored[i].obj.setMap(null);
            }
            if (typeof(stored[i].obj.remove) === 'function') {
                stored[i].obj.remove();
            }
            if (stored[i].shadow){ // only overlays has shadow
                if (typeof(stored[i].shadow.remove) === 'function') {
                    stored[i].obj.remove();
                }
                if (typeof(stored[i].shadow.setMap) === 'function') {
                    stored[i].shadow.setMap(null);
                }
                delete stored[i].shadow;
            }
            delete stored[i].obj;
            delete stored[i].data;
            delete stored[i];
        }
        
        this.freeAll = function(){
            var i;
            for(i = 0; i < stored.length; i++){
                if (stored[i]) {
                    this.freeIndex(i);
                }
            }
            stored = [];
        }
        
        this.freeDiff = function(clusters){
            var i, j, same = {}, idx = [];
            for(i=0; i<clusters.length; i++){
                idx.push( clusters[i].idx.join('-') );
            }
            for(i = 0; i < stored.length; i++){
                if (!stored[i]) {
                    continue;
                }
                j = $.inArray(stored[i].data.idx.join('-'), idx);
                if (j >= 0){
                    same[j] = true;
                } else {
                    this.freeIndex(i);
                }
            }
            return same;
        }
        
        this.add = function(latLng, marker){
            markers.push({latLng:latLng, marker:marker});
        }
        
        this.get = function(i){
            return markers[i];
        }
        
        this.clusters = function(map, radius, maxZoom, force){
            var proj = map.getProjection(),
                    nwP = proj.fromLatLngToPoint(
                        new google.maps.LatLng(
                                map.getBounds().getNorthEast().lat(),
                                map.getBounds().getSouthWest().lng()
                        )
                    ),
                    i, j, j2, p, x, y, k, k2, 
                    z = map.getZoom(),
                    pos = {}, 
                    saved = {},
                    unik = {},
                    clusters = [],
                    cluster,
                    chk,
                    lat, lng, keys, cnt,
                    bounds = map.getBounds(),
                    noClusters = maxZoom && (maxZoom <= map.getZoom()),
                    chkContain = map.getZoom() > 2;
            
            cnt = 0;
            keys = {};
            for(i = 0; i < markers.length; i++){
                if (chkContain && !bounds.contains(markers[i].latLng)){
                    continue;
                }
                p = proj.fromLatLngToPoint(markers[i].latLng);
                pos[i] = [
                    Math.floor((p.x - nwP.x) * Math.pow(2, z)),
                    Math.floor((p.y - nwP.y) * Math.pow(2, z))
                ];
                keys[i] = true;
                cnt++;
            }
            // check if visible markers have changed 
            if (!force && !noClusters){
                for(k = 0; k < latest.length; k++){
                    if( k in keys ){
                        cnt--;
                    } else {
                        break;
                    }
                }
                if (!cnt){
                    return false; // no change
                }
            }
            
            // save current keys to check later if an update has been done 
            latest = keys;
            
            keys = [];
            for(i in pos){
                x = pos[i][0];
                y = pos[i][1];
                if ( !(x in saved) ){
                    saved[x] = {};
                }
                if (!( y in saved[x]) ) {
                    saved[x][y] = i;
                    unik[i] = {};
                    keys.push(i);
                }
                unik[ saved[x][y] ][i] = true;
            }
            radius = Math.pow(radius, 2);
            delete(saved);
            
            k = 0;
            while(1){
                while((k <keys.length) && !(keys[k] in unik)){
                    k++;
                }
                if (k == keys.length){
                    break;
                }
                i = keys[k];
                lat = pos[i][0];
                lng = pos[i][1];
                saved = null;
                
                
                if (noClusters){
                    saved = {lat:lat, lng:lng, idx:[i]};
                } else {
                    do{
                        cluster = {lat:0, lng:0, idx:[]};
                        for(k2 = k; k2<keys.length; k2++){
                            if (!(keys[k2] in unik)){
                                continue;
                            }
                            j = keys[k2];
                            if ( Math.pow(lat - pos[j][0], 2) + Math.pow(lng-pos[j][1], 2) <= radius ){
                                for(j2 in unik[j]){
                                    cluster.lat += markers[j2].latLng.lat();
                                    cluster.lng += markers[j2].latLng.lng();
                                    cluster.idx.push(j2);
                                }
                            }
                        }
                        cluster.lat /= cluster.idx.length;
                        cluster.lng /= cluster.idx.length;
                        if (!saved){
                            chk = cluster.idx.length > 1;
                            saved = cluster;
                        } else {
                            chk = cluster.idx.length > saved.idx.length;
                            if (chk){
                                saved = cluster;
                            }
                        }
                        if (chk){
                            p = proj.fromLatLngToPoint( new google.maps.LatLng(saved.lat, saved.lng) );
                            lat = Math.floor((p.x - nwP.x) * Math.pow(2, z));
                            lng = Math.floor((p.y - nwP.y) * Math.pow(2, z));
                        }
                    } while(chk);
                }
                 
                for(k2 = 0; k2 < saved.idx.length; k2++){
                    if (saved.idx[k2] in unik){
                        delete(unik[saved.idx[k2]]);
                    }
                }
                clusters.push(saved);
            }
            return clusters;
        }
        
        this.getBounds = function(){
            var i, bounds = new google.maps.LatLngBounds();
            for(i=0; i<markers.length; i++){
                bounds.extend(markers[i].latLng);
            }
            return bounds;
        }
    }

    /***************************************************************************/
    /*                           GMAP3 GLOBALS                                 */
    /***************************************************************************/
    
    var _default = {},
        _properties = ['events','onces','options','apply', 'callback', 'data', 'tag'],
        _noInit = ['init', 'geolatlng', 'getlatlng', 'getroute', 'getelevation', 'getdistance', 'addstyledmap', 'setdefault', 'destroy'],
        _directs = ['get'],
        geocoder = directionsService = elevationService = maxZoomService = distanceMatrixService = null;
        
    function setDefault(values){
        for(var k in values){
            if (typeof(_default[k]) === 'object'){
                _default[k] = $.extend({}, _default[k], values[k]);
            } else {
                _default[k] = values[k];
            }
        }
    }
    
    function autoInit(iname){
        if (!iname){
            return true;
        }
        for(var i = 0; i < _noInit.length; i++){
            if (_noInit[i] === iname) {
                return false;
            }
        }
        return true;
    }
    
        
    /**
     * return true if action has to be executed directly
     **/
    function isDirect (todo){
        var action = ival(todo, 'action');
        for(var i = 0; i < _directs.length; i++){
            if (_directs[i] === action) {
                return true;
            }
        }
        return false;
    }
                
    //-----------------------------------------------------------------------//
    // Objects tools
    //-----------------------------------------------------------------------//
    
    /**
     * return the real key by an insensitive seach
     **/
    function ikey (object, key){
        if (key.toLowerCase){
            key = key.toLowerCase();
            for(var k in object){
                if (k.toLowerCase && (k.toLowerCase() == key)) {
                    return k;
                }
            }
        }
        return false;
    }
    
    /**
     * return the value of real key by an insensitive seach
     **/
    function ival (object, key, def){
        var k = ikey(object, key);
        return k ? object[k] : def;
    }
    
    /**
     * return true if at least one key is set in object
     * nb: keys in lowercase
     **/
    function hasKey (object, keys){
        var n, k;
        if (!object || !keys) {
            return false;
        }
        keys = array(keys);
        for(n in object){
            if (n.toLowerCase){
                n = n.toLowerCase();
                for(k in keys){
                    if (n == keys[k]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    /**
     * return a standard object
     * nb: include in lowercase
     **/
    function extractObject (todo, include, result/* = {} */){
        if (hasKey(todo, _properties) || hasKey(todo, include)){ // #1 classical object definition
            var i, k;
            // get defined properties values from todo
            for(i=0; i<_properties.length; i++){
                k = ikey(todo, _properties[i]);
                result[ _properties[i] ] = k ? todo[k] : {};
            }
            if (include && include.length){
                for(i=0; i<include.length; i++){
                    if(k = ikey(todo, include[i])){
                        result[ include[i] ] = todo[k];
                    }
                }
            }
            return result;
        } else { // #2 simplified object (all excepted "action" are options properties)
            result.options= {};
            for(k in todo){
                if (k !== 'action'){
                    result.options[k] = todo[k];
                }
            }
            return result;
        }
    }
    
    /**
     * identify object from object list or parameters list : [ objectName:{data} ] or [ otherObject:{}, ] or [ object properties ]
     * nb: include, exclude in lowercase
     **/
    function getObject(name, todo, include, exclude){
        var iname = ikey(todo, name),
                i, result = {}, keys=['map'];
        // include callback from high level
        result['callback'] = ival(todo, 'callback');
        include = array(include);
        exclude = array(exclude);
        if (iname) {
            return extractObject(todo[iname], include, result);
        }
        if (exclude && exclude.length){
            for(i=0; i<exclude.length; i++) {
                keys.push(exclude[i]);
            }
        }
        if (!hasKey(todo, keys)){
            result = extractObject(todo, include, result);
        }
        // initialize missing properties
        for(i=0; i<_properties.length; i++){
            if (_properties[i] in result){
                continue;
            }
            result[ _properties[i] ] = {};
        }
        return result;
    }
    
    //-----------------------------------------------------------------------//
    // Service tools
    //-----------------------------------------------------------------------//
        
    function getGeocoder(){
        if (!geocoder) {
            geocoder = new google.maps.Geocoder();
        }
        return geocoder;
    }
    
    function getDirectionsService(){
        if (!directionsService) {
            directionsService = new google.maps.DirectionsService();
        }
        return directionsService;
    }
    
    function getElevationService(){
        if (!elevationService) {
            elevationService = new google.maps.ElevationService();
        }
        return elevationService;
    }
    
    function getMaxZoomService(){
        if (!maxZoomService) {
            maxZoomService = new google.maps.MaxZoomService();
        }
        return maxZoomService;
    }
    
    function getDistanceMatrixService(){
        if (!distanceMatrixService) {
            distanceMatrixService = new google.maps.DistanceMatrixService();
        }
        return distanceMatrixService;
    }
        
    //-----------------------------------------------------------------------//
    // Unit tools
    //-----------------------------------------------------------------------//
    
    /**
     * return true if mixed is usable as number
     **/
    function numeric(mixed){
        return (typeof(mixed) === 'number' || typeof(mixed) === 'string') && mixed !== '' && !isNaN(mixed);
    }
    
        /**
     * convert data to array
     **/
    function array(mixed){
        var k, a = [];
        if (mixed !== undefined){
            if (typeof(mixed) === 'object'){
                if (typeof(mixed.length) === 'number') {
                    a = mixed;
                } else {
                    for(k in mixed) {
                        a.push(mixed[k]);
                    }
                }
            } else{ 
                a.push(mixed);
            }
        }
        return a;
    }
    
    /**
     * convert mixed [ lat, lng ] objet to google.maps.LatLng
     **/
    function toLatLng (mixed, emptyReturnMixed, noFlat){
        var empty = emptyReturnMixed ? mixed : null;
        if (!mixed || (typeof(mixed) === 'string')){
            return empty;
        }
        // defined latLng
        if (mixed.latLng) {
            return toLatLng(mixed.latLng);
        }
        // google.maps.LatLng object
        if (typeof(mixed.lat) === 'function') {
            return mixed;
        } 
        // {lat:X, lng:Y} object
        else if ( numeric(mixed.lat) ) {
            return new google.maps.LatLng(mixed.lat, mixed.lng);
        }
        // [X, Y] object 
        else if ( !noFlat && mixed.length){ // and "no flat" object allowed
            if ( !numeric(mixed[0]) || !numeric(mixed[1]) ) {
                return empty;
            }
            return new google.maps.LatLng(mixed[0], mixed[1]);
        }
        return empty;
    }
    
    /**
     * convert mixed [ sw, ne ] object by google.maps.LatLngBounds
     **/
    function toLatLngBounds(mixed, flatAllowed, emptyReturnMixed){
        var ne, sw, empty;
        if (!mixed) {
            return null;
        }
        empty = emptyReturnMixed ? mixed : null;
        if (typeof(mixed.getCenter) === 'function') {
            return mixed;
        }
        if (mixed.length){
            if (mixed.length == 2){
                ne = toLatLng(mixed[0]);
                sw = toLatLng(mixed[1]);
            } else if (mixed.length == 4){
                ne = toLatLng([mixed[0], mixed[1]]);
                sw = toLatLng([mixed[2], mixed[3]]);
            }
        } else {
            if ( ('ne' in mixed) && ('sw' in mixed) ){
                ne = toLatLng(mixed.ne);
                sw = toLatLng(mixed.sw);
            } else if ( ('n' in mixed) && ('e' in mixed) && ('s' in mixed) && ('w' in mixed) ){
                ne = toLatLng([mixed.n, mixed.e]);
                sw = toLatLng([mixed.s, mixed.w]);
            }
        }
        if (ne && sw){
            return new google.maps.LatLngBounds(sw, ne);
        }
        return empty;
    }

    /***************************************************************************/
    /*                                GMAP3                                    */
    /***************************************************************************/
    
    function Gmap3($this){
    
        var stack = new Stack(),
                store = new Store(),
                map = null,
                styles = {},
                running = false;
        
        //-----------------------------------------------------------------------//
        // Stack tools
        //-----------------------------------------------------------------------//
                
        /**
         * store actions to execute in a stack manager
         **/
        this._plan = function(list){
            for(var k = 0; k < list.length; k++) {
                stack.add(list[k]);
            }
            this._run();
        }
         
        /**
         * store one action to execute in a stack manager after the current
         **/
        this._planNext = function(todo){
            stack.addNext(todo);
        }
        
        /**
         * execute action directly
         **/
        this._direct = function(todo){
            var action = ival(todo, 'action');
            return this[action]($.extend({}, action in _default ? _default[action] : {}, todo.args ? todo.args : todo));
        }
        
        /**
         * called when action in finished, to acknoledge the current in stack and start next one
         **/
        this._end = function(){
            running = false;
            stack.ack();
            this._run();
        },
        /**
         * if not running, start next action in stack
         **/
        this._run = function(){
            if (running) {
                return;
            }
            var todo = stack.get();
            if (!todo) {
                return;
            }
            running = true;
            this._proceed(todo);
        }
        
        //-----------------------------------------------------------------------//
        // Call tools
        //-----------------------------------------------------------------------//
        
        /**
         * run the appropriated function
         **/
        this._proceed = function(todo){
            todo = todo || {};
            var action = ival(todo, 'action') || 'init',
                    iaction = action.toLowerCase(),
                    ok = true,
                    target = ival(todo, 'target'), 
                    args = ival(todo, 'args'),
                    out;
            // check if init should be run automatically
            if ( !map && autoInit(iaction) ){
                this.init($.extend({}, _default.init, todo.args && todo.args.map ? todo.args.map : todo.map ? todo.map : {}), true);
            }
            
            // gmap3 function
            if (!target && !args && (iaction in this) && (typeof(this[iaction]) === 'function')){
                this[iaction]($.extend({}, iaction in _default ? _default[iaction] : {}, todo.args ? todo.args : todo)); // call fnc and extends defaults data
            } else {
                // "target" object function
                if (target && (typeof(target) === 'object')){
                    if (ok = (typeof(target[action]) === 'function')){
                        out = target[action].apply(target, todo.args ? todo.args : []);
                    }
                // google.maps.Map direct function :  no result so not rewrited, directly wrapped using array "args" as parameters (ie. setOptions, addMapType, ...)
                } else if (map){
                    if (ok = (typeof(map[action]) === 'function')){
                        out = map[action].apply(map, todo.args ? todo.args : [] );
                    }
                }
                if (!ok && _default.verbose) {
                    alert("unknown action : " + action);
                }
                this._callback(out, todo);
                this._end();
            }
        }
        
        /**
         * returns the geographical coordinates from an address and call internal or given method
         **/
         this._resolveLatLng = function(todo, method, all, attempt){
            var address = ival(todo, 'address'),
                    params,
                    that = this,
                    fnc = typeof(method) === 'function' ? method : that[method];
            if ( address ){
                if (!attempt){ // convert undefined to int
                    attempt = 0;
                }
                if (typeof(address) === 'object'){
                    params = address;
                } else {
                    params = {'address': address};
                }
                getGeocoder().geocode(
                    params, 
                    function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK){
                        fnc.apply(that, [todo, all ? results : results[0].geometry.location]);
                    } else if ( (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) && (attempt < _default.queryLimit.attempt) ){
                        setTimeout(function(){
                                that._resolveLatLng(todo, method, all, attempt+1);
                            },
                            _default.queryLimit.delay + Math.floor(Math.random() * _default.queryLimit.random)
                        );
                    } else {
                        if (_default.verbose){
                            alert('Geocode error : ' + status);
                        }
                        fnc.apply(that, [todo, false]);;
                    }
                }
            );
            } else {
                fnc.apply(that, [todo, toLatLng(todo, false, true)]);
            }
        }
        
        /**
         * returns the geographical coordinates from an array of object using "address" and call internal method
         **/
        this._resolveAllLatLng = function(todo, property, method){
            var that = this,
                    i = -1,
                    solveNext = function(){
                        do{
                            i++;
                        }while( (i < todo[property].length) && !('address' in todo[property][i]) );
                        if (i < todo[property].length){
                            (function(todo){
                                that._resolveLatLng(
                                    todo,
                                    function(todo, latLng){
                                        todo.latLng = latLng;
                                        solveNext.apply(that, []); // solve next or execute exit method
                                    }
                                );
                            })(todo[property][i]);
                        } else {
                            that[method](todo);
                        }
                    };
            solveNext();
        }
        
        /**
         * call a function of framework or google map object of the instance
         **/
        this._call = function(/* fncName [, ...] */){
            var i, fname = arguments[0], args = [];
            if ( !arguments.length || !map || (typeof(map[fname]) !== 'function') ){
                return;
            }
            for(i=1; i<arguments.length; i++){
                args.push(arguments[i]);
            }
            return map[fname].apply(map, args);
        }
        
        /**
         * init if not and manage map subcall (zoom, center)
         **/
        this._subcall = function(todo, latLng){
            var opts = {};
            if (!todo.map) return;
            if (!latLng) {
                latLng = ival(todo.map, 'latlng');
            }
            if (!map){
                if (latLng) {
                    opts = {center:latLng};
                }
                this.init($.extend({}, todo.map, opts), true);
            } else { 
                if (todo.map.center && latLng){
                    this._call("setCenter", latLng);
                }
                if (todo.map.zoom !== undefined){
                    this._call("setZoom", todo.map.zoom);
                }
                if (todo.map.mapTypeId !== undefined){
                    this._call("setMapTypeId", todo.map.mapTypeId);
                }
            }
        }
        
        /**
         * attach an event to a sender 
         **/
        this._attachEvent = function(sender, name, fnc, data, once){
            google.maps.event['addListener'+(once?'Once':'')](sender, name, function(event) {
                fnc.apply($this, [sender, event, data]);
            });
        }
        
        /**
         * attach events from a container to a sender 
         * todo[
         *  events => { eventName => function, }
         *  onces  => { eventName => function, }  
         *  data   => mixed data         
         * ]
         **/
        this._attachEvents = function(sender, todo){
            var name;
            if (!todo) {
                return
            }
            if (todo.events){
                for(name in todo.events){
                    if (typeof(todo.events[name]) === 'function'){
                        this._attachEvent(sender, name, todo.events[name], todo.data, false);
                    }
                }
            }
            if (todo.onces){
                for(name in todo.onces){
                    if (typeof(todo.onces[name]) === 'function'){
                        this._attachEvent(sender, name, todo.onces[name], todo.data, true);
                    }
                }
            }
        }
        
        /**
         * execute callback functions 
         **/
        this._callback = function(result, todo){
            if (typeof(todo.callback) === 'function') {
                todo.callback.apply($this, [result]);
            } else if (typeof(todo.callback) === 'object') {
                for(var i=0; i<todo.callback.length; i++){
                    if (typeof(todo.callback[i]) === 'function') {
                        todo.callback[k].apply($this, [result]);
                    }
                }
            }
        }
        
        /**
         * execute ending functions 
         **/
        this._manageEnd = function(result, todo, internal){
            var i, apply;
            if (result && (typeof(result) === 'object')){
                // attach events
                this._attachEvents(result, todo);
                // execute "apply"
                if (todo.apply && todo.apply.length){
                    for(i=0; i<todo.apply.length; i++){
                        apply = todo.apply[i];
                        // need an existing "action" function in the result object
                        if(!apply.action || (typeof(result[apply.action]) !== 'function') ) { 
                            continue;
                        }
                        if (apply.args) {
                            result[apply.action].apply(result, apply.args);
                        } else {
                            result[apply.action]();
                        }
                    }
                }
            }
            if (!internal) {
                this._callback(result, todo);
                this._end();
            }
        }
        
        //-----------------------------------------------------------------------//
        // gmap3 functions
        //-----------------------------------------------------------------------//
        
        /**
         * destroy an existing instance
         **/
        this.destroy = function(todo){
            var k;
            store.clear();
            $this.empty();
            for(k in styles){
                delete styles[ k ];
            }
            styles = {};
            if (map){
                delete map;
            }
            this._callback(null, todo);
            this._end();
        }
        
        /**
         * Initialize google.maps.Map object
         **/
        this.init = function(todo, internal){
            var o, k, opts;
            if (map) { // already initialized
                return this._end();
            }
            
            o = getObject('map', todo);
            if ( (typeof(o.options.center) === 'boolean') && o.options.center) {
                return false; // wait for an address resolution
            }
            opts = $.extend({}, _default.init, o.options);
            if (!opts.center) {
                opts.center = [_default.init.center.lat, _default.init.center.lng];
            }
            opts.center = toLatLng(opts.center);
            map = new _default.classes.Map($this.get(0), opts);
            
            // add previous added styles
            for(k in styles) {
                map.mapTypes.set(k, styles[k]);
            }
            
            this._manageEnd(map, o, internal);
            return true;
        }
        
        /**
         * returns the geographical coordinates from an address
         **/
        this.getlatlng = function(todo){
            this._resolveLatLng(todo, '_getLatLng', true);
        },
        
        this._getLatLng = function(todo, results){
            this._manageEnd(results, todo);
        },
        
        
        /**
         * returns address from latlng        
         **/
        this.getaddress = function(todo, attempt){
            var latLng = toLatLng(todo, false, true),
                    address = ival(todo, 'address'),
                    params = latLng ?  {latLng:latLng} : ( address ? (typeof(address) === 'string' ? {address:address} : address) : null),
                    callback = ival(todo, 'callback'),
                    that = this;
            if (!attempt){ // convert undefined to int
                attempt = 0;
            }
            if (params && typeof(callback) === 'function') {
                getGeocoder().geocode(
                    params, 
                    function(results, status) {
                        if ( (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) && (attempt < _default.queryLimit.attempt) ){
                            setTimeout(function(){
                                    that.getaddress(todo, attempt+1);
                                },
                                _default.queryLimit.delay + Math.floor(Math.random() * _default.queryLimit.random)
                            );
                        } else {
                            var out = status === google.maps.GeocoderStatus.OK ? results : false;
                            callback.apply($this, [out, status]);
                            if (!out && _default.verbose){
                                alert('Geocode error : ' + status);
                            }
                            that._end();
                        }
                    } 
                );
            } else {
                this._end();
            }
        }
        
        /**
         * return a route
         **/
        this.getroute = function(todo){
            var callback = ival(todo, 'callback'),
                    that = this;
            if ( (typeof(callback) === 'function') && todo.options ) {
                todo.options.origin = toLatLng(todo.options.origin, true);
                todo.options.destination = toLatLng(todo.options.destination, true);
                getDirectionsService().route(
                    todo.options,
                    function(results, status) {
                        var out = status == google.maps.DirectionsStatus.OK ? results : false;
                        callback.apply($this, [out, status]);
                        that._end();
                    }
                );
            } else {
                this._end();
            }
        }
        
        /**
         * return the elevation of a location
         **/
        this.getelevation = function(todo){
            var fnc, path, samples, i,
                    locations = [],
                    callback = ival(todo, 'callback'),
                    latLng = ival(todo, 'latlng'),
                    that = this;
                    
            if (typeof(callback) === 'function'){
                fnc = function(results, status){
                    var out = status === google.maps.ElevationStatus.OK ? results : false;
                    callback.apply($this, [out, status]);
                    that._end();
                };
                if (latLng){
                    locations.push(toLatLng(latLng));
                } else {
                    locations = ival(todo, 'locations') || [];
                    if (locations){
                        locations = array(locations);
                        for(i=0; i<locations.length; i++){
                            locations[i] = toLatLng(locations[i]);
                        }
                    }
                }
                if (locations.length){
                    getElevationService().getElevationForLocations({locations:locations}, fnc);
                } else {
                    path = ival(todo, 'path');
                    samples = ival(todo, 'samples');
                    if (path && samples){
                        for(i=0; i<path.length; i++){
                            locations.push(toLatLng(path[i]));
                        }
                        if (locations.length){
                            getElevationService().getElevationAlongPath({path:locations, samples:samples}, fnc);
                        }
                    }
                }
            } else {
                this._end();
            }
        }
        
        /**
         * return the distance between an origin and a destination
         *      
         **/
        this.getdistance = function(todo){
            var i, 
                    callback = ival(todo, 'callback'),
                    that = this;
            if ( (typeof(callback) === 'function') && todo.options && todo.options.origins && todo.options.destinations ) {
                // origins and destinations are array containing one or more address strings and/or google.maps.LatLng objects
                todo.options.origins = array(todo.options.origins);
                for(i=0; i<todo.options.origins.length; i++){
                    todo.options.origins[i] = toLatLng(todo.options.origins[i], true);
                }
                todo.options.destinations = array(todo.options.destinations);
                for(i=0; i<todo.options.destinations.length; i++){
                    todo.options.destinations[i] = toLatLng(todo.options.destinations[i], true);
                }
                getDistanceMatrixService().getDistanceMatrix(
                    todo.options,
                    function(results, status) {
                        var out = status == google.maps.DistanceMatrixStatus.OK ? results : false;
                        callback.apply($this, [out, status]);
                        that._end();
                    }
                );
            } else {
                this._end();
            }
        }
        
        /**
         * Add a marker to a map after address resolution
         * if [infowindow] add an infowindow attached to the marker   
         **/
        this.addmarker = function(todo){
            this._resolveLatLng(todo, '_addMarker');
        }
        
        this._addMarker = function(todo, latLng, internal){
            var result, oi, to,
                    o = getObject('marker', todo, 'to');
            if (!internal){
                if (!latLng) {
                    this._manageEnd(false, o);
                    return;
                }
                this._subcall(todo, latLng);
            } else if (!latLng){
                return;
            }
            if (o.to){
                to = store.refToObj(o.to);
                result = to && (typeof(to.add) === 'function');
                if (result){
                    to.add(latLng, todo);
                    if (typeof(to.redraw) === 'function'){
                        to.redraw();
                    }
                }
                if (!internal){
                    this._manageEnd(result, o);
                }
            } else {
                o.options.position = latLng;
                o.options.map = map;
                result = new _default.classes.Marker(o.options);
                if (hasKey(todo, 'infowindow')){
                    oi = getObject('infowindow', todo['infowindow'], 'open');
                    // if "open" is not defined, add it in first position
                    if ( (oi.open === undefined) || oi.open ){
                        oi.apply = array(oi.apply);
                        oi.apply.unshift({action:'open', args:[map, result]});
                    }
                    oi.action = 'addinfowindow';
                    this._planNext(oi); 
                }
                if (!internal){
                    store.add('marker', result, o);
                    this._manageEnd(result, o);
                }
            }
            return result;
        }
        
        /**
         * add markers (without address resolution)
         **/
        this.addmarkers = function(todo){
            if (ival(todo, 'clusters')){
                this._resolveAllLatLng(todo, 'markers', '_addclusteredmarkers');
            } else {
                this._resolveAllLatLng(todo, 'markers', '_addmarkers');
            }
        }
        
        this._addmarkers = function(todo){
            var result, o, i, latLng, marker, options = {}, tmp, to, 
                    markers = ival(todo, 'markers');
            this._subcall(todo);
            if (typeof(markers) !== 'object') {
                return this._end();
            }
            o = getObject('marker', todo, ['to', 'markers']);
            
            if (o.to){
                to = store.refToObj(o.to);
                result = to && (typeof(to.add) === 'function');
                if (result){
                    for(i=0; i<markers.length; i++){
                        if (latLng = toLatLng(markers[i])) {
                            to.add(latLng, markers[i]);
                        }
                    }
                    if (typeof(to.redraw) === 'function'){
                        to.redraw();
                    }
                }
                this._manageEnd(result, o);
            } else {
                $.extend(true, options, o.options);
                options.map = map;
                result = [];
                for(i=0; i<markers.length; i++){
                    if (latLng = toLatLng(markers[i])){
                        if (markers[i].options){
                            tmp = {};
                            $.extend(true, tmp, options, markers[i].options);
                            o.options = tmp;
                        } else {
                            o.options = options;
                        }
                        o.options.position = latLng;
                        marker = new _default.classes.Marker(o.options);
                        result.push(marker);
                        o.data = markers[i].data;
                        o.tag = markers[i].tag;
                        store.add('marker', marker, o);
                        this._manageEnd(marker, o, true);
                    }
                }
                o.options = options; // restore previous for futur use
                this._callback(result, todo);
                this._end();
            }
        }
        
        this._addclusteredmarkers = function(todo){
            var clusterer, i, latLng, storeId,
                    that = this,
                    radius = ival(todo, 'radius'),
                    maxZoom = ival(todo, 'maxZoom'),
                    markers = ival(todo, 'markers'),
                    styles = ival(todo, 'clusters');
            
            if (!map.getBounds()){ // map not initialised => bounds not available
                // wait for map
                google.maps.event.addListenerOnce(
                    map, 
                    'bounds_changed', 
                    function() {
                        that._addclusteredmarkers(todo);
                    }
                );
                return;
            }
            
            if (typeof(radius) === 'number'){
                clusterer = new Clusterer();
                for(i=0 ; i<markers.length; i++){
                    latLng = toLatLng(markers[i]);
                    clusterer.add(latLng, markers[i]);
                }
                storeId = this._initClusters(todo, clusterer, radius, maxZoom, styles);
            }
            
            this._callback(storeId, todo);
            this._end();
        }
        
        
        this._initClusters = function(todo, clusterer, radius, maxZoom, styles){
            var that = this;
            
            clusterer.setRedraw(function(force){
                var same, clusters = clusterer.clusters(map, radius, maxZoom, force);
                if (clusters){
                    same = clusterer.freeDiff(clusters);
                    that._displayClusters(todo, clusterer, clusters, same, styles);
                }
            });
            
            clusterer.events(
                google.maps.event.addListener(
                    map, 
                    'zoom_changed',
                    function() {
                        clusterer.redraw(true);
                    }
                ),
                google.maps.event.addListener(
                    map, 
                    'bounds_changed',
                    function() {
                        clusterer.redraw();
                    }
                )
            );
            
            clusterer.redraw();
            return store.add('cluster', clusterer, todo);
        }
        
        this._displayClusters = function(todo, clusterer, clusters, same, styles){
            var k, i, ii, m, done, obj, shadow, cluster, options, tmp, w, h,
                    atodo, offset,
                    ctodo = hasKey(todo, 'cluster') ? getObject('', ival(todo, 'cluster')) : {},
                    mtodo = hasKey(todo, 'marker') ? getObject('', ival(todo, 'marker')) : {};
            for(i=0; i<clusters.length; i++){
                if (i in same){
                    continue;
                }
                cluster = clusters[i];
                done = false;
                if (cluster.idx.length > 1){
                    // look for the cluster design to use
                    m = 0;
                    for(k in styles){
                        if ( (k > m) && (k <= cluster.idx.length) ){
                            m = k;
                        }
                    }
                    if (styles[m]){ // cluster defined for the current markers count
                        w = ival(styles[m], 'width');
                        h = ival(styles[m], 'height');
                        offset = ival(styles[m], 'offset') || [-w/2, -h/2];
                        
                        // create a custom _addOverlay command
                        atodo = {};
                        $.extend(
                            true, 
                            atodo, 
                            ctodo, 
                            { options:{
                                    pane: 'overlayLayer',
                                    content:styles[m].content.replace('CLUSTER_COUNT', cluster.idx.length),
                                    offset:{
                                        x: offset[0],
                                        y: offset[1]
                                    }
                                }
                            }
                        );
                        obj = this._addOverlay(atodo, toLatLng(cluster), true);
                        atodo.options.pane = 'floatShadow';
                        atodo.options.content = $('<div></div>');
                        atodo.options.content.width(w);
                        atodo.options.content.height(h);
                        shadow = this._addOverlay(atodo, toLatLng(cluster), true);
                        
                        // store data to the clusterer
                        ctodo.data = {
                            latLng: toLatLng(cluster),
                            markers:[]
                        };
                        for(ii=0; ii<cluster.idx.length; ii++){
                            ctodo.data.markers.push(
                                clusterer.get(cluster.idx[ii]).marker
                            );
                        }
                        this._attachEvents(shadow, ctodo);
                        clusterer.store(cluster, obj, shadow);
                        done = true;
                    }
                }
                if (!done){ // cluster not defined (< min count) or = 1 so display all markers of the current cluster
                    // save the defaults options for the markers
                    options = {};
                    $.extend(true, options, mtodo.options);
                    for(ii = 0; ii <cluster.idx.length; ii++){
                        m = clusterer.get(cluster.idx[ii]);
                        mtodo.latLng = m.latLng;
                        mtodo.data = m.marker.data;
                        mtodo.tag = m.marker.tag;
                        if (m.marker.options){
                            tmp = {};
                            $.extend(true, tmp, options, m.marker.options);
                            mtodo.options = tmp;
                        } else {
                            mtodo.options = options;
                        }
                        obj = this._addMarker(mtodo, mtodo.latLng, true);
                        this._attachEvents(obj, mtodo);
                        clusterer.store(cluster, obj);
                    }
                    mtodo.options = options; // restore previous for futur use
                }
            }
        }
        
        /**
         * add an infowindow after address resolution
         **/
        this.addinfowindow = function(todo){ 
            this._resolveLatLng(todo, '_addInfoWindow');
        }
        
        this._addInfoWindow = function(todo, latLng){
            var o, infowindow, args = [];
            this._subcall(todo, latLng);
            o = getObject('infowindow', todo, ['open', 'anchor']);
            if (latLng) {
                o.options.position = latLng;
            }
            infowindow = new _default.classes.InfoWindow(o.options);
            if ( (o.open === undefined) || o.open ){
                o.apply = array(o.apply);
                args.push(map);
                if (o.anchor){
                    args.push(o.anchor);
                }
                o.apply.unshift({action:'open', args:args});
            }
            store.add('infowindow', infowindow, o);
            this._manageEnd(infowindow, o);
        }
        
        
        /**
         * add a polygone / polylin on a map
         **/
        this.addpolyline = function(todo){
            this._addPoly(todo, 'Polyline', 'path');
        }
        
        this.addpolygon = function(todo){
            this._addPoly(todo, 'Polygon', 'paths');
        }
        
        this._addPoly = function(todo, poly, path){
            var i, 
                    obj, latLng, 
                    o = getObject(poly.toLowerCase(), todo, path);
            if (o[path]){
                o.options[path] = [];
                for(i=0; i<o[path].length; i++){
                    if (latLng = toLatLng(o[path][i])){
                        o.options[path].push(latLng);
                    }
                }
            }
            obj = new google.maps[poly](o.options);
            obj.setMap(map);
            store.add(poly.toLowerCase(), obj, o);
            this._manageEnd(obj, o);
        }
        
        /**
         * add a circle   
         **/
        this.addcircle = function(todo){
            this._resolveLatLng(todo, '_addCircle');
        }
        
        this._addCircle = function(todo, latLng){
            var c, o = getObject('circle', todo);
            if (!latLng) {
                latLng = toLatLng(o.options.center);
            }
            if (!latLng) {
                return this._manageEnd(false, o);
            }
            this._subcall(todo, latLng);
            o.options.center = latLng;
            o.options.map = map;
            c = new _default.classes.Circle(o.options);
            store.add('circle', c, o);
            this._manageEnd(c, o);
        }
        
        /**
         * add a rectangle   
         **/
        this.addrectangle = function(todo){
            this._resolveLatLng(todo, '_addRectangle');
        }
        
        this._addRectangle = function(todo, latLng ){
            var r, o = getObject('rectangle', todo);
            o.options.bounds = toLatLngBounds(o.options.bounds, true);
            if (!o.options.bounds) {
                return this._manageEnd(false, o);
            }
            this._subcall(todo, o.options.bounds.getCenter());
            o.options.map = map;
            r = new _default.classes.Rectangle(o.options);
            store.add('rectangle', r, o);
            this._manageEnd(r, o);
        }    
        
        /**
         * add an overlay to a map after address resolution
         **/
        this.addoverlay = function(todo){
            this._resolveLatLng(todo, '_addOverlay');
        }
        
        this._addOverlay = function(todo, latLng, internal){
            var ov,  
                    o = getObject('overlay', todo),
                    opts =  $.extend({
                                        pane: 'floatPane',
                                        content: '',
                                        offset:{
                                            x:0,y:0
                                        }
                                    },
                                    o.options),
                    $div = $('<div></div>'),
                    listeners = [];
             
             $div
                    .css('border', 'none')
                    .css('borderWidth', '0px')
                    .css('position', 'absolute');
                $div.append(opts.content);
            
            function f() {
             _default.classes.OverlayView.call(this);
                this.setMap(map);
            }            
            
            f.prototype = new _default.classes.OverlayView();
            
            f.prototype.onAdd = function() {
                var panes = this.getPanes();
                if (opts.pane in panes) {
                    $(panes[opts.pane]).append($div);
                }
            }
            f.prototype.draw = function() {
                var overlayProjection = this.getProjection(),
                        ps = overlayProjection.fromLatLngToDivPixel(latLng),
                        that = this;
                        
                $div
                    .css('left', (ps.x+opts.offset.x) + 'px')
                    .css('top' , (ps.y+opts.offset.y) + 'px');
                
                $.each( ("dblclick click mouseover mousemove mouseout mouseup mousedown").split(" "), function( i, name ) {
                    listeners.push(
                        google.maps.event.addDomListener($div[0], name, function(e) {
                            google.maps.event.trigger(that, name);
                        })
                    );
                });
                listeners.push(
                    google.maps.event.addDomListener($div[0], "contextmenu", function(e) {
                        google.maps.event.trigger(that, "rightclick");
                    })
                );
            }
            f.prototype.onRemove = function() {
                for (var i = 0; i < listeners.length; i++) {
                    google.maps.event.removeListener(listeners[i]);
                }
                $div.remove();
            }
            f.prototype.hide = function() {
                $div.hide();
            }
            f.prototype.show = function() {
                $div.show();
            }
            f.prototype.toggle = function() {
                if ($div) {
                    if ($div.is(':visible')){
                        this.show();
                    } else {
                        this.hide();
                    }
                }
            }
            f.prototype.toggleDOM = function() {
                if (this.getMap()) {
                    this.setMap(null);
                } else {
                    this.setMap(map);
                }
            }
            f.prototype.getDOMElement = function() {
                return $div[0];
            }
            ov = new f();
            if (!internal){
                store.add('overlay', ov, o);
                this._manageEnd(ov, o);
            }
            return ov;
        }
        
        /**
         * add a fix panel to a map
         **/
        this.addfixpanel = function(todo){
            var o = getObject('fixpanel', todo),
                    x=y=0, $c, $div;
            if (o.options.content){
                $c = $(o.options.content);
                
                if (o.options.left !== undefined){
                    x = o.options.left;
                } else if (o.options.right !== undefined){
                    x = $this.width() - $c.width() - o.options.right;
                } else if (o.options.center){
                    x = ($this.width() - $c.width()) / 2;
                }
                
                if (o.options.top !== undefined){
                    y = o.options.top;
                } else if (o.options.bottom !== undefined){
                    y = $this.height() - $c.height() - o.options.bottom;
                } else if (o.options.middle){
                    y = ($this.height() - $c.height()) / 2
                }
            
                $div = $('<div></div>')
                                .css('position', 'absolute')
                                .css('top', y+'px')
                                .css('left', x+'px')
                                .css('z-index', '1000')
                                .append($c);
                
                $this.first().prepend($div);
                this._attachEvents(map, o);
                store.add('fixpanel', $div, o);
                this._callback($div, o);
            }
            this._end();
        }
        
        /**
         * add a direction renderer to a map
         **/
        this.adddirectionsrenderer = function(todo, internal){
            var dr, o = getObject('directionrenderer', todo, 'panelId');
            o.options.map = map;
            dr = new google.maps.DirectionsRenderer(o.options);
            if (o.panelId) {
                dr.setPanel(document.getElementById(o.panelId));
            }
            store.add('directionrenderer', dr, o);
            this._manageEnd(dr, o, internal);
            return dr;
        }
        
        /**
         * set a direction panel to a dom element from its ID
         **/
        this.setdirectionspanel = function(todo){
            var dr = store.get('directionrenderer'),
                    o = getObject('directionpanel', todo, 'id');
            if (dr && o.id) {
                dr.setPanel(document.getElementById(o.id));
            }
            this._manageEnd(dr, o);
        }
        
        /**
         * set directions on a map (create Direction Renderer if needed)
         **/
        this.setdirections = function(todo){
            var dr = store.get('directionrenderer'),
                    o = getObject('directions', todo);
            if (todo) {
                o.options.directions = todo.directions ? todo.directions : (todo.options && todo.options.directions ? todo.options.directions : null);
            }
            if (o.options.directions) {
                if (!dr) {
                    dr = this.adddirectionsrenderer(o, true);
                } else {
                    dr.setDirections(o.options.directions);
                }
            }
            this._manageEnd(dr, o);
        }
        
        /**
         * set a streetview to a map
         **/
        this.setstreetview = function(todo){
            var panorama,
                    o = getObject('streetview', todo, 'id');
            if (o.options.position){
                o.options.position = toLatLng(o.options.position);
            }
            panorama = new _default.classes.StreetViewPanorama(document.getElementById(o.id),o.options);
            if (panorama){
                map.setStreetView(panorama);
            }
            this._manageEnd(panorama, o);
        }
        
        /**
         * add a kml layer to a map
         **/
        this.addkmllayer = function(todo){
            var kml,
                    o = getObject('kmllayer', todo, 'url');
            o.options.map = map;
            if (typeof(o.url) === 'string'){
                kml = new _default.classes.KmlLayer(o.url, o.options);
            }
            store.add('kmllayer', kml, o);
            this._manageEnd(kml, o);
        }
        
        /**
         * add a traffic layer to a map
         **/
        this.addtrafficlayer = function(todo){
            var o = getObject('trafficlayer', todo),
                    tl = store.get('trafficlayer');
            if (!tl){
                tl = new _default.classes.TrafficLayer();
                tl.setMap(map);
                store.add('trafficlayer', tl, o);
            }
            this._manageEnd(tl, o);
        }
        
        /**
         * add a bicycling layer to a map
         **/
        this.addbicyclinglayer = function(todo){
            var o = getObject('bicyclinglayer', todo),
                    bl = store.get('bicyclinglayer');
            if (!bl){
                bl = new _default.classes.BicyclingLayer();
                bl.setMap(map);
                store.add('bicyclinglayer', bl, o);
            }
            this._manageEnd(bl, o);
        }
        
        /**
         * add a ground overlay to a map
         **/
        this.addgroundoverlay = function(todo){
            var ov,
                    o = getObject('groundoverlay', todo, ['bounds', 'url']);
            o.bounds = toLatLngBounds(o.bounds);
            if (o.bounds && (typeof(o.url) === 'string')){
                ov = new _default.classes.GroundOverlay(o.url, o.bounds);
                ov.setMap(map);
                store.add('groundoverlay', ov, o);
            }
            this._manageEnd(ov, o);
        }
        
        /**
         * geolocalise the user and return a LatLng
         **/
        this.geolatlng = function(todo){
            var callback = ival(todo, 'callback');
            if (typeof(callback) === 'function') {
                if(navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            var out = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
                            callback.apply($this, [out]);
                        }, 
                        function() {
                            var out = false;
                            callback.apply($this, [out]);
                        }
                    );
                } else if (google.gears) {
                    google.gears.factory.create('beta.geolocation').getCurrentPosition(
                        function(position) {
                            var out = new google.maps.LatLng(position.latitude,position.longitude);
                            callback.apply($this, [out]);
                        }, 
                        function() {
                            out = false;
                            callback.apply($this, [out]);
                        }
                    );
                } else {
                    callback.apply($this, [false]);
                }
            }
            this._end();
        }
        
        /**
         * add a style to a map
         **/
        this.addstyledmap = function(todo, internal){
            var o = getObject('styledmap', todo, ['id', 'style']);
            if  (o.style && o.id && !styles[o.id]) {
                styles[o.id] = new _default.classes.StyledMapType(o.style, o.options);
                if (map) {
                    map.mapTypes.set(o.id, styles[o.id]);
                }
            }
            this._manageEnd(styles[o.id], o, internal);
        }
        
        /**
         * set a style to a map (add it if needed)
         **/
        this.setstyledmap = function(todo){
            var o = getObject('styledmap', todo, ['id', 'style']);
            if (o.id) {
                this.addstyledmap(o, true);
                if (styles[o.id]) {
                    map.setMapTypeId(o.id);
                    this._callback(styles[o.id], todo);
                }
            }
            this._manageEnd(styles[o.id], o);
        }
        
        /**
         * remove objects from a map
         **/
        this.clear = function(todo){
            var list = array(ival(todo, 'list') || ival(todo, 'name')),
                    last = ival(todo, 'last', false),
                    first = ival(todo, 'first', false),
                    tag = ival(todo, 'tag');
            if (tag !== undefined){
                tag = array(tag);
            }
            store.clear(list, last, first, tag);
            this._end();
        }
        
        /**
         * return objects previously created
         **/
        this.get = function(todo){
            var name = ival(todo, 'name') || 'map',
                    first= ival(todo, 'first'),
                    all  = ival(todo, 'all'),
                    tag = ival(todo, 'tag');
            name = name.toLowerCase();
            if (name === 'map'){
                return map;
            }
            if (tag !== undefined){
                tag = array(tag);
            }
            if (first){
                return store.get(name, false, tag);
            } else if (all){
                return store.all(name, tag);
            } else {
                return store.get(name, true, tag);
            }
        }
        
        /**
         * return the max zoom of a location
         **/
        this.getmaxzoom = function(todo){
            this._resolveLatLng(todo, '_getMaxZoom');
        }
        
        this._getMaxZoom = function(todo, latLng){
            var callback = ival(todo, 'callback'),
                    that = this;
            if (callback && typeof(callback) === 'function') {
                getMaxZoomService().getMaxZoomAtLatLng(
                    latLng, 
                    function(result) {
                        var zoom = result.status === google.maps.MaxZoomStatus.OK ? result.zoom : false;
                        callback.apply($this, [zoom, result.status]);
                        that._end();
                    }
                );
            } else {
                this._end();
            }
        }
        
        /**
         * modify default values
         **/
        this.setdefault = function(todo){
            setDefault(todo);
            this._end();
        }
        
        /**
         * autofit a map using its overlays (markers, rectangles ...)
         **/
        this.autofit = function(todo, internal){
            var names, list, obj, i, j,
                    empty = true, 
                    bounds = new google.maps.LatLngBounds(),
                    maxZoom = ival(todo, 'maxZoom', null);

            names = store.names();
            for(i=0; i<names.length; i++){
                list = store.all(names[i]);
                for(j=0; j<list.length; j++){
                    obj = list[j];
                    if (obj.getPosition){
                        bounds.extend(obj.getPosition());
                        empty = false;
                    } else if (obj.getBounds){
                        bounds.extend(obj.getBounds().getNorthEast());
                        bounds.extend(obj.getBounds().getSouthWest());
                        empty = false;
                    } else if (obj.getPaths){
                        obj.getPaths().forEach(function(path){
                            path.forEach(function(latLng){
                                bounds.extend(latLng);
                                empty = false;
                            });
                        });
                    } else if (obj.getPath){
                        obj.getPath().forEach(function(latLng){
                            bounds.extend(latLng);
                            empty = false;
                        });
                    } else if (obj.getCenter){
                        bounds.extend(obj.getCenter());
                        empty = false;
                    }
                }
            }

            if (!empty && (!map.getBounds() || !map.getBounds().equals(bounds))){
                if (maxZoom !== null){
                    // fitBouds Callback event => detect zoom level and check maxZoom
                    google.maps.event.addListenerOnce(
                        map, 
                        'bounds_changed', 
                        function() {
                            if (this.getZoom() > maxZoom){
                                this.setZoom(maxZoom);
                            }
                        }
                    );
                }
                map.fitBounds(bounds);
            }
            if (!internal){
                this._manageEnd(empty ? false : bounds, todo, internal);
            }
        }
        
    };
    
    //-----------------------------------------------------------------------//
    // jQuery plugin
    //-----------------------------------------------------------------------//
        
    $.fn.gmap3 = function(){
        var i, args, list = [], empty = true, results = [];

        if ($.isEmptyObject(_default)) {
            _default = {
                verbose: false,
                queryLimit: {
                    attempt: 5,
                    delay: 250,
                    random: 250
                },
                init: {
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    center: [46.578498, 2.457275],
                    zoom: 2
                },
                classes: {
                    Map: google.maps.Map,
                    Marker: google.maps.Marker,
                    InfoWindow: google.maps.InfoWindow,
                    Circle: google.maps.Circle,
                    Rectangle: google.maps.Rectangle,
                    OverlayView: google.maps.OverlayView,
                    StreetViewPanorama: google.maps.StreetViewPanorama,
                    KmlLayer: google.maps.KmlLayer,
                    TrafficLayer: google.maps.TrafficLayer,
                    BicyclingLayer: google.maps.BicyclingLayer,
                    GroundOverlay: google.maps.GroundOverlay,
                    StyledMapType: google.maps.StyledMapType
                }
            };
        }

        // store all arguments in a todo list 
        for(i=0; i<arguments.length; i++){
            args = arguments[i] || {};
            // resolve string todo - action without parameters can be simplified as string 
            if (typeof(args) === 'string'){
                args = {action:args};
            }
            list.push(args);
        }
        // resolve empty call - run init
        if (!list.length) {
            list.push({});
        }
        // loop on each jQuery object
        $.each(this, function() {
            var $this = $(this),
                    gmap3 = $this.data('gmap3');
            empty = false;
            if (!gmap3){
                gmap3 = new Gmap3($this);
                $this.data('gmap3', gmap3);
            }
            // direct call : bypass jQuery method (not stackable, return mixed)
            if ( (list.length == 1) && (isDirect(list[0])) ){
                results.push(gmap3._direct(list[0]));
            } else {
                gmap3._plan(list);
            }
        });
        // return for direct call (only) 
        if (results.length){
            if (results.length === 1){ // 1 css selector
                return results[0];
            } else {
                return results;
            }
        }
        // manage setDefault call
        if (empty && (arguments.length == 2) && (typeof(arguments[0]) === 'string') && (arguments[0].toLowerCase() === 'setdefault')){
            setDefault(arguments[1]);
        }
        return this;
    }

})(jQuery);

/**
 * @name CSS3 InfoBubble with tabs for Google Maps API V3
 * @version 0.8
 * @author Luke Mahe
 * @fileoverview
 * This library is a CSS Infobubble with tabs. It uses css3 rounded corners and
 * drop shadows and animations. It also allows tabs
 */

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * A CSS3 InfoBubble v0.8
 * @param {Object.<string, *>=} opt_options Optional properties to set.
 * @extends {google.maps.OverlayView}
 * @constructor
 */
function InfoBubble(opt_options) {
  this.extend(InfoBubble, google.maps.OverlayView);
  this.tabs_ = [];
  this.activeTab_ = null;
  this.baseZIndex_ = 100;
  this.isOpen_ = false;

  var options = opt_options || {};

  if (options['backgroundColor'] == undefined) {
    options['backgroundColor'] = this.BACKGROUND_COLOR_;
  }

  if (options['borderColor'] == undefined) {
    options['borderColor'] = this.BORDER_COLOR_;
  }

  if (options['borderRadius'] == undefined) {
    options['borderRadius'] = this.BORDER_RADIUS_;
  }

  if (options['borderWidth'] == undefined) {
    options['borderWidth'] = this.BORDER_WIDTH_;
  }

  if (options['padding'] == undefined) {
    options['padding'] = this.PADDING_;
  }

  if (options['arrowPosition'] == undefined) {
    options['arrowPosition'] = this.ARROW_POSITION_;
  }

  if (options['disableAutoPan'] == undefined) {
    options['disableAutoPan'] = false;
  }

  if (options['disableAnimation'] == undefined) {
    options['disableAnimation'] = false;
  }

  if (options['minWidth'] == undefined) {
    options['minWidth'] = this.MIN_WIDTH_;
  }

  if (options['shadowStyle'] == undefined) {
    options['shadowStyle'] = this.SHADOW_STYLE_;
  }

  if (options['arrowSize'] == undefined) {
    options['arrowSize'] = this.ARROW_SIZE_;
  }

  if (options['arrowStyle'] == undefined) {
    options['arrowStyle'] = this.ARROW_STYLE_;
  }

  this.buildDom_();

  this.setValues(options);
}
window['InfoBubble'] = InfoBubble;


/**
 * Default arrow size
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_SIZE_ = 15;


/**
 * Default arrow style
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_STYLE_ = 0;


/**
 * Default shadow style
 * @const
 * @private
 */
InfoBubble.prototype.SHADOW_STYLE_ = 1;


/**
 * Default min width
 * @const
 * @private
 */
InfoBubble.prototype.MIN_WIDTH_ = 50;


/**
 * Default arrow position
 * @const
 * @private
 */
InfoBubble.prototype.ARROW_POSITION_ = 50;


/**
 * Default padding
 * @const
 * @private
 */
InfoBubble.prototype.PADDING_ = 10;


/**
 * Default border width
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_WIDTH_ = 1;


/**
 * Default border color
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_COLOR_ = '#ccc';


/**
 * Default border radius
 * @const
 * @private
 */
InfoBubble.prototype.BORDER_RADIUS_ = 10;


/**
 * Default background color
 * @const
 * @private
 */
InfoBubble.prototype.BACKGROUND_COLOR_ = '#fff';


/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
InfoBubble.prototype.extend = function(obj1, obj2) {
  return (function(object) {
    for (var property in object.prototype) {
      this.prototype[property] = object.prototype[property];
    }
    return this;
  }).apply(obj1, [obj2]);
};


/**
 * Builds the InfoBubble dom
 * @private
 */
InfoBubble.prototype.buildDom_ = function() {
  var bubble = this.bubble_ = document.createElement('DIV');
  bubble.style['position'] = 'absolute';
  bubble.style['zIndex'] = this.baseZIndex_;

  var tabsContainer = this.tabsContainer_ = document.createElement('DIV');
  tabsContainer.style['position'] = 'relative';

  // Close button
  var close = this.close_ = document.createElement('IMG');
  close.style['position'] = 'absolute';
  close.style['width'] = this.px(12);
  close.style['height'] = this.px(12);
  close.style['border'] = 0;
  close.style['zIndex'] = this.baseZIndex_ + 1;
  close.style['cursor'] = 'pointer';
  close.src = 'http://maps.gstatic.com/intl/en_us/mapfiles/iw_close.gif';

  var that = this;
  google.maps.event.addDomListener(close, 'click', function() {
    that.close();
    google.maps.event.trigger(that, 'closeclick');
  });

  // Content area
  var contentContainer = this.contentContainer_ = document.createElement('DIV');
  contentContainer.style['overflowX'] = 'auto';
  contentContainer.style['overflowY'] = 'auto';
  contentContainer.style['cursor'] = 'default';
  contentContainer.style['clear'] = 'both';
  contentContainer.style['position'] = 'relative';

  var content = this.content_ = document.createElement('DIV');
  contentContainer.appendChild(content);

  // Arrow
  var arrow = this.arrow_ = document.createElement('DIV');
  arrow.style['position'] = 'relative';

  var arrowOuter = this.arrowOuter_ = document.createElement('DIV');
  var arrowInner = this.arrowInner_ = document.createElement('DIV');

  var arrowSize = this.getArrowSize_();

  arrowOuter.style['position'] = arrowInner.style['position'] = 'absolute';
  arrowOuter.style['left'] = arrowInner.style['left'] = '50%';
  arrowOuter.style['height'] = arrowInner.style['height'] = '0';
  arrowOuter.style['width'] = arrowInner.style['width'] = '0';
  arrowOuter.style['marginLeft'] = this.px(-arrowSize);
  arrowOuter.style['borderWidth'] = this.px(arrowSize);
  arrowOuter.style['borderBottomWidth'] = 0;

  // Shadow
  var bubbleShadow = this.bubbleShadow_ = document.createElement('DIV');
  bubbleShadow.style['position'] = 'absolute';

  // Hide the InfoBubble by default
  bubble.style['display'] = bubbleShadow.style['display'] = 'none';

  bubble.appendChild(this.tabsContainer_);
  bubble.appendChild(close);
  bubble.appendChild(contentContainer);
  arrow.appendChild(arrowOuter);
  arrow.appendChild(arrowInner);
  bubble.appendChild(arrow);

  var stylesheet = document.createElement('style');
  stylesheet.setAttribute('type', 'text/css');

  /**
   * The animation for the infobubble
   * @type {string}
   */
  this.animationName_ = '_ibani_' + Math.round(Math.random() * 10000);

  var css = '.' + this.animationName_ + '{-webkit-animation-name:' +
      this.animationName_ + ';-webkit-animation-duration:0.5s;' +
      '-webkit-animation-iteration-count:1;}' +
      '@-webkit-keyframes ' + this.animationName_ + ' {from {' +
      '-webkit-transform: scale(0)}50% {-webkit-transform: scale(1.2)}90% ' +
      '{-webkit-transform: scale(0.95)}to {-webkit-transform: scale(1)}}';

  stylesheet.textContent = css;
  document.getElementsByTagName('head')[0].appendChild(stylesheet);
};


/**
 * Sets the background class name
 *
 * @param {string} className The class name to set.
 */
InfoBubble.prototype.setBackgroundClassName = function(className) {
  this.set('backgroundClassName', className);
};
InfoBubble.prototype['setBackgroundClassName'] =
    InfoBubble.prototype.setBackgroundClassName;


/**
 * changed MVC callback
 */
InfoBubble.prototype.backgroundClassName_changed = function() {
  this.content_.className = this.get('backgroundClassName');
};
InfoBubble.prototype['backgroundClassName_changed'] =
    InfoBubble.prototype.backgroundClassName_changed;


/**
 * Sets the class of the tab
 *
 * @param {string} className the class name to set.
 */
InfoBubble.prototype.setTabClassName = function(className) {
  this.set('tabClassName', className);
};
InfoBubble.prototype['setTabClassName'] =
    InfoBubble.prototype.setTabClassName;


/**
 * tabClassName changed MVC callback
 */
InfoBubble.prototype.tabClassName_changed = function() {
  this.updateTabStyles_();
};
InfoBubble.prototype['tabClassName_changed'] =
    InfoBubble.prototype.tabClassName_changed;


/**
 * Gets the style of the arrow
 *
 * @private
 * @return {number} The style of the arrow.
 */
InfoBubble.prototype.getArrowStyle_ = function() {
  return parseInt(this.get('arrowStyle'), 10) || 0;
};


/**
 * Sets the style of the arrow
 *
 * @param {number} style The style of the arrow.
 */
InfoBubble.prototype.setArrowStyle = function(style) {
  this.set('arrowStyle', style);
};
InfoBubble.prototype['setArrowStyle'] =
    InfoBubble.prototype.setArrowStyle;


/**
 * Arrow style changed MVC callback
 */
InfoBubble.prototype.arrowStyle_changed = function() {
  this.arrowSize_changed();
};
InfoBubble.prototype['arrowStyle_changed'] =
    InfoBubble.prototype.arrowStyle_changed;


/**
 * Gets the size of the arrow
 *
 * @private
 * @return {number} The size of the arrow.
 */
InfoBubble.prototype.getArrowSize_ = function() {
  return parseInt(this.get('arrowSize'), 10) || 0;
};


/**
 * Sets the size of the arrow
 *
 * @param {number} size The size of the arrow.
 */
InfoBubble.prototype.setArrowSize = function(size) {
  this.set('arrowSize', size);
};
InfoBubble.prototype['setArrowSize'] =
    InfoBubble.prototype.setArrowSize;


/**
 * Arrow size changed MVC callback
 */
InfoBubble.prototype.arrowSize_changed = function() {
  this.borderWidth_changed();
};
InfoBubble.prototype['arrowSize_changed'] =
    InfoBubble.prototype.arrowSize_changed;


/**
 * Set the position of the InfoBubble arrow
 *
 * @param {number} pos The position to set.
 */
InfoBubble.prototype.setArrowPosition = function(pos) {
  this.set('arrowPosition', pos);
};
InfoBubble.prototype['setArrowPosition'] =
    InfoBubble.prototype.setArrowPosition;


/**
 * Get the position of the InfoBubble arrow
 *
 * @private
 * @return {number} The position..
 */
InfoBubble.prototype.getArrowPosition_ = function() {
  return parseInt(this.get('arrowPosition'), 10) || 0;
};


/**
 * arrowPosition changed MVC callback
 */
InfoBubble.prototype.arrowPosition_changed = function() {
  var pos = this.getArrowPosition_();
  this.arrowOuter_.style['left'] = this.arrowInner_.style['left'] = pos + '%';

  this.redraw_();
};
InfoBubble.prototype['arrowPosition_changed'] =
    InfoBubble.prototype.arrowPosition_changed;


/**
 * Set the zIndex of the InfoBubble
 *
 * @param {number} zIndex The zIndex to set.
 */
InfoBubble.prototype.setZIndex = function(zIndex) {
  this.set('zIndex', zIndex);
};
InfoBubble.prototype['setZIndex'] = InfoBubble.prototype.setZIndex;


/**
 * Get the zIndex of the InfoBubble
 *
 * @return {number} The zIndex to set.
 */
InfoBubble.prototype.getZIndex = function() {
  return parseInt(this.get('zIndex'), 10) || this.baseZIndex_;
};


/**
 * zIndex changed MVC callback
 */
InfoBubble.prototype.zIndex_changed = function() {
  var zIndex = this.getZIndex();

  this.bubble_.style['zIndex'] = this.baseZIndex_ = zIndex;
  this.close_.style['zIndex'] = zIndex + 1;
};
InfoBubble.prototype['zIndex_changed'] = InfoBubble.prototype.zIndex_changed;


/**
 * Set the style of the shadow
 *
 * @param {number} shadowStyle The style of the shadow.
 */
InfoBubble.prototype.setShadowStyle = function(shadowStyle) {
  this.set('shadowStyle', shadowStyle);
};
InfoBubble.prototype['setShadowStyle'] = InfoBubble.prototype.setShadowStyle;


/**
 * Get the style of the shadow
 *
 * @private
 * @return {number} The style of the shadow.
 */
InfoBubble.prototype.getShadowStyle_ = function() {
  return parseInt(this.get('shadowStyle'), 10) || 0;
};


/**
 * shadowStyle changed MVC callback
 */
InfoBubble.prototype.shadowStyle_changed = function() {
  var shadowStyle = this.getShadowStyle_();

  var display = '';
  var shadow = '';
  var backgroundColor = '';
  switch (shadowStyle) {
    case 0:
      display = 'none';
      break;
    case 1:
      shadow = '40px 15px 10px rgba(33,33,33,0.3)';
      backgroundColor = 'transparent';
      break;
    case 2:
      shadow = '0 0 2px rgba(33,33,33,0.3)';
      backgroundColor = 'rgba(33,33,33,0.35)';
      break;
  }
  this.bubbleShadow_.style['boxShadow'] =
      this.bubbleShadow_.style['webkitBoxShadow'] =
      this.bubbleShadow_.style['MozBoxShadow'] = shadow;
  this.bubbleShadow_.style['backgroundColor'] = backgroundColor;
  if (this.isOpen_) {
    this.bubbleShadow_.style['display'] = display;
    this.draw();
  }
};
InfoBubble.prototype['shadowStyle_changed'] =
    InfoBubble.prototype.shadowStyle_changed;


/**
 * Show the close button
 */
InfoBubble.prototype.showCloseButton = function() {
  this.set('hideCloseButton', false);
};
InfoBubble.prototype['showCloseButton'] = InfoBubble.prototype.showCloseButton;


/**
 * Hide the close button
 */
InfoBubble.prototype.hideCloseButton = function() {
  this.set('hideCloseButton', true);
};
InfoBubble.prototype['hideCloseButton'] = InfoBubble.prototype.hideCloseButton;


/**
 * hideCloseButton changed MVC callback
 */
InfoBubble.prototype.hideCloseButton_changed = function() {
  this.close_.style['display'] = this.get('hideCloseButton') ? 'none' : '';
};
InfoBubble.prototype['hideCloseButton_changed'] =
    InfoBubble.prototype.hideCloseButton_changed;


/**
 * Set the background color
 *
 * @param {string} color The color to set.
 */
InfoBubble.prototype.setBackgroundColor = function(color) {
  if (color) {
    this.set('backgroundColor', color);
  }
};
InfoBubble.prototype['setBackgroundColor'] =
    InfoBubble.prototype.setBackgroundColor;


/**
 * backgroundColor changed MVC callback
 */
InfoBubble.prototype.backgroundColor_changed = function() {
  var backgroundColor = this.get('backgroundColor');
  this.contentContainer_.style['backgroundColor'] = backgroundColor;

  this.arrowInner_.style['borderColor'] = backgroundColor +
      ' transparent transparent';
  this.updateTabStyles_();
};
InfoBubble.prototype['backgroundColor_changed'] =
    InfoBubble.prototype.backgroundColor_changed;


/**
 * Set the border color
 *
 * @param {string} color The border color.
 */
InfoBubble.prototype.setBorderColor = function(color) {
  if (color) {
    this.set('borderColor', color);
  }
};
InfoBubble.prototype['setBorderColor'] = InfoBubble.prototype.setBorderColor;


/**
 * borderColor changed MVC callback
 */
InfoBubble.prototype.borderColor_changed = function() {
  var borderColor = this.get('borderColor');

  var contentContainer = this.contentContainer_;
  var arrowOuter = this.arrowOuter_;
  contentContainer.style['borderColor'] = borderColor;

  arrowOuter.style['borderColor'] = borderColor +
      ' transparent transparent';

  contentContainer.style['borderStyle'] =
      arrowOuter.style['borderStyle'] =
      this.arrowInner_.style['borderStyle'] = 'solid';

  this.updateTabStyles_();
};
InfoBubble.prototype['borderColor_changed'] =
    InfoBubble.prototype.borderColor_changed;


/**
 * Set the radius of the border
 *
 * @param {number} radius The radius of the border.
 */
InfoBubble.prototype.setBorderRadius = function(radius) {
  this.set('borderRadius', radius);
};
InfoBubble.prototype['setBorderRadius'] = InfoBubble.prototype.setBorderRadius;


/**
 * Get the radius of the border
 *
 * @private
 * @return {number} The radius of the border.
 */
InfoBubble.prototype.getBorderRadius_ = function() {
  return parseInt(this.get('borderRadius'), 10) || 0;
};


/**
 * borderRadius changed MVC callback
 */
InfoBubble.prototype.borderRadius_changed = function() {
  var borderRadius = this.getBorderRadius_();
  var borderWidth = this.getBorderWidth_();

  this.contentContainer_.style['borderRadius'] =
      this.contentContainer_.style['MozBorderRadius'] =
      this.contentContainer_.style['webkitBorderRadius'] =
      this.bubbleShadow_.style['borderRadius'] =
      this.bubbleShadow_.style['MozBorderRadius'] =
      this.bubbleShadow_.style['webkitBorderRadius'] = this.px(borderRadius);

  this.tabsContainer_.style['paddingLeft'] =
      this.tabsContainer_.style['paddingRight'] =
      this.px(borderRadius + borderWidth);

  this.redraw_();
};
InfoBubble.prototype['borderRadius_changed'] =
    InfoBubble.prototype.borderRadius_changed;


/**
 * Get the width of the border
 *
 * @private
 * @return {number} width The width of the border.
 */
InfoBubble.prototype.getBorderWidth_ = function() {
  return parseInt(this.get('borderWidth'), 10) || 0;
};


/**
 * Set the width of the border
 *
 * @param {number} width The width of the border.
 */
InfoBubble.prototype.setBorderWidth = function(width) {
  this.set('borderWidth', width);
};
InfoBubble.prototype['setBorderWidth'] = InfoBubble.prototype.setBorderWidth;


/**
 * borderWidth change MVC callback
 */
InfoBubble.prototype.borderWidth_changed = function() {
  var borderWidth = this.getBorderWidth_();

  this.contentContainer_.style['borderWidth'] = this.px(borderWidth);
  this.tabsContainer_.style['top'] = this.px(borderWidth);

  this.updateArrowStyle_();
  this.updateTabStyles_();
  this.borderRadius_changed();
  this.redraw_();
};
InfoBubble.prototype['borderWidth_changed'] =
    InfoBubble.prototype.borderWidth_changed;


/**
 * Update the arrow style
 * @private
 */
InfoBubble.prototype.updateArrowStyle_ = function() {
  var borderWidth = this.getBorderWidth_();
  var arrowSize = this.getArrowSize_();
  var arrowStyle = this.getArrowStyle_();
  var arrowOuterSizePx = this.px(arrowSize);
  var arrowInnerSizePx = this.px(Math.max(0, arrowSize - borderWidth));

  var outer = this.arrowOuter_;
  var inner = this.arrowInner_;

  this.arrow_.style['marginTop'] = this.px(-borderWidth);
  outer.style['borderTopWidth'] = arrowOuterSizePx;
  inner.style['borderTopWidth'] = arrowInnerSizePx;

  // Full arrow or arrow pointing to the left
  if (arrowStyle == 0 || arrowStyle == 1) {
    outer.style['borderLeftWidth'] = arrowOuterSizePx;
    inner.style['borderLeftWidth'] = arrowInnerSizePx;
  } else {
    outer.style['borderLeftWidth'] = inner.style['borderLeftWidth'] = 0;
  }

  // Full arrow or arrow pointing to the right
  if (arrowStyle == 0 || arrowStyle == 2) {
    outer.style['borderRightWidth'] = arrowOuterSizePx;
    inner.style['borderRightWidth'] = arrowInnerSizePx;
  } else {
    outer.style['borderRightWidth'] = inner.style['borderRightWidth'] = 0;
  }

  if (arrowStyle < 2) {
    outer.style['marginLeft'] = this.px(-(arrowSize));
    inner.style['marginLeft'] = this.px(-(arrowSize - borderWidth));
  } else {
    outer.style['marginLeft'] = inner.style['marginLeft'] = 0;
  }

  // If there is no border then don't show thw outer arrow
  if (borderWidth == 0) {
    outer.style['display'] = 'none';
  } else {
    outer.style['display'] = '';
  }
};


/**
 * Set the padding of the InfoBubble
 *
 * @param {number} padding The padding to apply.
 */
InfoBubble.prototype.setPadding = function(padding) {
  this.set('padding', padding);
};
InfoBubble.prototype['setPadding'] = InfoBubble.prototype.setPadding;


/**
 * Set the padding of the InfoBubble
 *
 * @private
 * @return {number} padding The padding to apply.
 */
InfoBubble.prototype.getPadding_ = function() {
  return parseInt(this.get('padding'), 10) || 0;
};


/**
 * padding changed MVC callback
 */
InfoBubble.prototype.padding_changed = function() {
  var padding = this.getPadding_();
  this.contentContainer_.style['padding'] = this.px(padding);
  this.updateTabStyles_();

  this.redraw_();
};
InfoBubble.prototype['padding_changed'] = InfoBubble.prototype.padding_changed;


/**
 * Add px extention to the number
 *
 * @param {number} num The number to wrap.
 * @return {string|number} A wrapped number.
 */
InfoBubble.prototype.px = function(num) {
  if (num) {
    // 0 doesn't need to be wrapped
    return num + 'px';
  }
  return num;
};


/**
 * Add events to stop propagation
 * @private
 */
InfoBubble.prototype.addEvents_ = function() {
  // We want to cancel all the events so they do not go to the map
  var events = ['mousedown', 'mousemove', 'mouseover', 'mouseout', 'mouseup',
      'mousewheel', 'DOMMouseScroll', 'touchstart', 'touchend', 'touchmove',
      'dblclick', 'contextmenu', 'click'];

  var bubble = this.bubble_;
  this.listeners_ = [];
  for (var i = 0, event; event = events[i]; i++) {
    this.listeners_.push(
      google.maps.event.addDomListener(bubble, event, function(e) {
        e.cancelBubble = true;
        if (e.stopPropagation) {
          e.stopPropagation();
        }
      })
    );
  }
};


/**
 * On Adding the InfoBubble to a map
 * Implementing the OverlayView interface
 */
InfoBubble.prototype.onAdd = function() {
  if (!this.bubble_) {
    this.buildDom_();
  }

  this.addEvents_();

  var panes = this.getPanes();
  if (panes) {
    panes.floatPane.appendChild(this.bubble_);
    panes.floatShadow.appendChild(this.bubbleShadow_);
  }
};
InfoBubble.prototype['onAdd'] = InfoBubble.prototype.onAdd;


/**
 * Draw the InfoBubble
 * Implementing the OverlayView interface
 */
InfoBubble.prototype.draw = function() {
  var projection = this.getProjection();

  if (!projection) {
    // The map projection is not ready yet so do nothing
    return;
  }

  var latLng = /** @type {google.maps.LatLng} */ (this.get('position'));

  if (!latLng) {
    this.close();
    return;
  }

  var tabHeight = 0;

  if (this.activeTab_) {
    tabHeight = this.activeTab_.offsetHeight;
  }

  var anchorHeight = this.getAnchorHeight_();
  var arrowSize = this.getArrowSize_();
  var arrowPosition = this.getArrowPosition_();

  arrowPosition = arrowPosition / 100;

  var pos = projection.fromLatLngToDivPixel(latLng);
  var width = this.contentContainer_.offsetWidth;
  var height = this.bubble_.offsetHeight;

  if (!width) {
    return;
  }

  // Adjust for the height of the info bubble
  var top = pos.y - (height + arrowSize);

  if (anchorHeight) {
    // If there is an anchor then include the height
    top -= anchorHeight;
  }

  var left = pos.x - (width * arrowPosition);

  this.bubble_.style['top'] = this.px(top);
  this.bubble_.style['left'] = this.px(left);

  var shadowStyle = parseInt(this.get('shadowStyle'), 10);

  switch (shadowStyle) {
    case 1:
      // Shadow is behind
      this.bubbleShadow_.style['top'] = this.px(top + tabHeight - 1);
      this.bubbleShadow_.style['left'] = this.px(left);
      this.bubbleShadow_.style['width'] = this.px(width);
      this.bubbleShadow_.style['height'] =
          this.px(this.contentContainer_.offsetHeight - arrowSize);
      break;
    case 2:
      // Shadow is below
      width = width * 0.8;
      if (anchorHeight) {
        this.bubbleShadow_.style['top'] = this.px(pos.y);
      } else {
        this.bubbleShadow_.style['top'] = this.px(pos.y + arrowSize);
      }
      this.bubbleShadow_.style['left'] = this.px(pos.x - width * arrowPosition);

      this.bubbleShadow_.style['width'] = this.px(width);
      this.bubbleShadow_.style['height'] = this.px(2);
      break;
  }
};
InfoBubble.prototype['draw'] = InfoBubble.prototype.draw;


/**
 * Removing the InfoBubble from a map
 */
InfoBubble.prototype.onRemove = function() {
  if (this.bubble_ && this.bubble_.parentNode) {
    this.bubble_.parentNode.removeChild(this.bubble_);
  }
  if (this.bubbleShadow_ && this.bubbleShadow_.parentNode) {
    this.bubbleShadow_.parentNode.removeChild(this.bubbleShadow_);
  }

  for (var i = 0, listener; listener = this.listeners_[i]; i++) {
    google.maps.event.removeListener(listener);
  }
};
InfoBubble.prototype['onRemove'] = InfoBubble.prototype.onRemove;


/**
 * Is the InfoBubble open
 *
 * @return {boolean} If the InfoBubble is open.
 */
InfoBubble.prototype.isOpen = function() {
  return this.isOpen_;
};
InfoBubble.prototype['isOpen'] = InfoBubble.prototype.isOpen;


/**
 * Close the InfoBubble
 */
InfoBubble.prototype.close = function() {
  if (this.bubble_) {
    this.bubble_.style['display'] = 'none';
    // Remove the animation so we next time it opens it will animate again
    this.bubble_.className =
        this.bubble_.className.replace(this.animationName_, '');
  }

  if (this.bubbleShadow_) {
    this.bubbleShadow_.style['display'] = 'none';
    this.bubbleShadow_.className =
        this.bubbleShadow_.className.replace(this.animationName_, '');
  }
  this.isOpen_ = false;
};
InfoBubble.prototype['close'] = InfoBubble.prototype.close;


/**
 * Open the InfoBubble (asynchronous).
 *
 * @param {google.maps.Map=} opt_map Optional map to open on.
 * @param {google.maps.MVCObject=} opt_anchor Optional anchor to position at.
 */
InfoBubble.prototype.open = function(opt_map, opt_anchor) {
  var that = this;
  window.setTimeout(function() {
    that.open_(opt_map, opt_anchor);
  }, 0);
};

/**
 * Open the InfoBubble
 * @private
 * @param {google.maps.Map=} opt_map Optional map to open on.
 * @param {google.maps.MVCObject=} opt_anchor Optional anchor to position at.
 */
InfoBubble.prototype.open_ = function(opt_map, opt_anchor) {
  this.updateContent_();

  if (opt_map) {
    this.setMap(opt_map);
  }

  if (opt_anchor) {
    this.set('anchor', opt_anchor);
    this.bindTo('anchorPoint', opt_anchor);
    this.bindTo('position', opt_anchor);
  }

  // Show the bubble and the show
  this.bubble_.style['display'] = this.bubbleShadow_.style['display'] = '';
  var animation = !this.get('disableAnimation');

  if (animation) {
    // Add the animation
    this.bubble_.className += ' ' + this.animationName_;
    this.bubbleShadow_.className += ' ' + this.animationName_;
  }

  this.redraw_();
  this.isOpen_ = true;

  var pan = !this.get('disableAutoPan');
  if (pan) {
    var that = this;
    window.setTimeout(function() {
      // Pan into view, done in a time out to make it feel nicer :)
      that.panToView();
    }, 200);
  }
};
InfoBubble.prototype['open'] = InfoBubble.prototype.open;


/**
 * Set the position of the InfoBubble
 *
 * @param {google.maps.LatLng} position The position to set.
 */
InfoBubble.prototype.setPosition = function(position) {
  if (position) {
    this.set('position', position);
  }
};
InfoBubble.prototype['setPosition'] = InfoBubble.prototype.setPosition;


/**
 * Returns the position of the InfoBubble
 *
 * @return {google.maps.LatLng} the position.
 */
InfoBubble.prototype.getPosition = function() {
  return /** @type {google.maps.LatLng} */ (this.get('position'));
};
InfoBubble.prototype['getPosition'] = InfoBubble.prototype.getPosition;


/**
 * position changed MVC callback
 */
InfoBubble.prototype.position_changed = function() {
  this.draw();
};
InfoBubble.prototype['position_changed'] =
    InfoBubble.prototype.position_changed;


/**
 * Pan the InfoBubble into view
 */
InfoBubble.prototype.panToView = function() {
  var projection = this.getProjection();

  if (!projection) {
    // The map projection is not ready yet so do nothing
    return;
  }

  if (!this.bubble_) {
    // No Bubble yet so do nothing
    return;
  }

  var anchorHeight = this.getAnchorHeight_();
  var height = this.bubble_.offsetHeight + anchorHeight;
  var map = this.get('map');
  var mapDiv = map.getDiv();
  var mapHeight = mapDiv.offsetHeight;

  var latLng = this.getPosition();
  var centerPos = projection.fromLatLngToContainerPixel(map.getCenter());
  var pos = projection.fromLatLngToContainerPixel(latLng);

  // Find out how much space at the top is free
  var spaceTop = centerPos.y - height;

  // Fine out how much space at the bottom is free
  var spaceBottom = mapHeight - centerPos.y;

  var needsTop = spaceTop < 0;
  var deltaY = 0;

  if (needsTop) {
    spaceTop *= -1;
    deltaY = (spaceTop + spaceBottom) / 2;
  }

  pos.y -= deltaY;
  latLng = projection.fromContainerPixelToLatLng(pos);

  if (map.getCenter() != latLng) {
    map.panTo(latLng);
  }
};
InfoBubble.prototype['panToView'] = InfoBubble.prototype.panToView;


/**
 * Converts a HTML string to a document fragment.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {Node} A HTML document fragment.
 * @private
 */
InfoBubble.prototype.htmlToDocumentFragment_ = function(htmlString) {
  htmlString = htmlString.replace(/^\s*([\S\s]*)\b\s*$/, '$1');
  var tempDiv = document.createElement('DIV');
  tempDiv.innerHTML = htmlString;
  if (tempDiv.childNodes.length == 1) {
    return /** @type {!Node} */ (tempDiv.removeChild(tempDiv.firstChild));
  } else {
    var fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};


/**
 * Removes all children from the node.
 *
 * @param {Node} node The node to remove all children from.
 * @private
 */
InfoBubble.prototype.removeChildren_ = function(node) {
  if (!node) {
    return;
  }

  var child;
  while (child = node.firstChild) {
    node.removeChild(child);
  }
};


/**
 * Sets the content of the infobubble.
 *
 * @param {string|Node} content The content to set.
 */
InfoBubble.prototype.setContent = function(content) {
  this.set('content', content);
};
InfoBubble.prototype['setContent'] = InfoBubble.prototype.setContent;


/**
 * Get the content of the infobubble.
 *
 * @return {string|Node} The marker content.
 */
InfoBubble.prototype.getContent = function() {
  return /** @type {Node|string} */ (this.get('content'));
};
InfoBubble.prototype['getContent'] = InfoBubble.prototype.getContent;


/**
 * Sets the marker content and adds loading events to images
 */
InfoBubble.prototype.updateContent_ = function() {
  if (!this.content_) {
    // The Content area doesnt exist.
    return;
  }

  this.removeChildren_(this.content_);
  var content = this.getContent();
  if (content) {
    if (typeof content == 'string') {
      content = this.htmlToDocumentFragment_(content);
    }
    this.content_.appendChild(content);

    var that = this;
    var images = this.content_.getElementsByTagName('IMG');
    for (var i = 0, image; image = images[i]; i++) {
      // Because we don't know the size of an image till it loads, add a
      // listener to the image load so the marker can resize and reposition
      // itself to be the correct height.
      google.maps.event.addDomListener(image, 'load', function() {
        that.imageLoaded_();
      });
    }
    google.maps.event.trigger(this, 'domready');
  }
  this.redraw_();
};

/**
 * Image loaded
 * @private
 */
InfoBubble.prototype.imageLoaded_ = function() {
  var pan = !this.get('disableAutoPan');
  this.redraw_();
  if (pan && (this.tabs_.length == 0 || this.activeTab_.index == 0)) {
    this.panToView();
  }
};

/**
 * Updates the styles of the tabs
 * @private
 */
InfoBubble.prototype.updateTabStyles_ = function() {
  if (this.tabs_ && this.tabs_.length) {
    for (var i = 0, tab; tab = this.tabs_[i]; i++) {
      this.setTabStyle_(tab.tab);
    }
    this.activeTab_.style['zIndex'] = this.baseZIndex_;
    var borderWidth = this.getBorderWidth_();
    var padding = this.getPadding_() / 2;
    this.activeTab_.style['borderBottomWidth'] = 0;
    this.activeTab_.style['paddingBottom'] = this.px(padding + borderWidth);
  }
};


/**
 * Sets the style of a tab
 * @private
 * @param {Element} tab The tab to style.
 */
InfoBubble.prototype.setTabStyle_ = function(tab) {
  var backgroundColor = this.get('backgroundColor');
  var borderColor = this.get('borderColor');
  var borderRadius = this.getBorderRadius_();
  var borderWidth = this.getBorderWidth_();
  var padding = this.getPadding_();

  var marginRight = this.px(-(Math.max(padding, borderRadius)));
  var borderRadiusPx = this.px(borderRadius);

  var index = this.baseZIndex_;
  if (tab.index) {
    index -= tab.index;
  }

  // The styles for the tab
  var styles = {
    'cssFloat': 'left',
    'position': 'relative',
    'cursor': 'pointer',
    'backgroundColor': backgroundColor,
    'border': this.px(borderWidth) + ' solid ' + borderColor,
    'padding': this.px(padding / 2) + ' ' + this.px(padding),
    'marginRight': marginRight,
    'whiteSpace': 'nowrap',
    'borderRadiusTopLeft': borderRadiusPx,
    'MozBorderRadiusTopleft': borderRadiusPx,
    'webkitBorderTopLeftRadius': borderRadiusPx,
    'borderRadiusTopRight': borderRadiusPx,
    'MozBorderRadiusTopright': borderRadiusPx,
    'webkitBorderTopRightRadius': borderRadiusPx,
    'zIndex': index,
    'display': 'inline'
  };

  for (var style in styles) {
    tab.style[style] = styles[style];
  }

  var className = this.get('tabClassName');
  if (className != undefined) {
    tab.className += ' ' + className;
  }
};


/**
 * Add user actions to a tab
 * @private
 * @param {Object} tab The tab to add the actions to.
 */
InfoBubble.prototype.addTabActions_ = function(tab) {
  var that = this;
  tab.listener_ = google.maps.event.addDomListener(tab, 'click', function() {
    that.setTabActive_(this);
  });
};


/**
 * Set a tab at a index to be active
 *
 * @param {number} index The index of the tab.
 */
InfoBubble.prototype.setTabActive = function(index) {
  var tab = this.tabs_[index - 1];

  if (tab) {
    this.setTabActive_(tab.tab);
  }
};
InfoBubble.prototype['setTabActive'] = InfoBubble.prototype.setTabActive;


/**
 * Set a tab to be active
 * @private
 * @param {Object} tab The tab to set active.
 */
InfoBubble.prototype.setTabActive_ = function(tab) {
  if (!tab) {
    this.setContent('');
    this.updateContent_();
    return;
  }

  var padding = this.getPadding_() / 2;
  var borderWidth = this.getBorderWidth_();

  if (this.activeTab_) {
    var activeTab = this.activeTab_;
    activeTab.style['zIndex'] = this.baseZIndex_ - activeTab.index;
    activeTab.style['paddingBottom'] = this.px(padding);
    activeTab.style['borderBottomWidth'] = this.px(borderWidth);
  }

  tab.style['zIndex'] = this.baseZIndex_;
  tab.style['borderBottomWidth'] = 0;
  tab.style['marginBottomWidth'] = '-10px';
  tab.style['paddingBottom'] = this.px(padding + borderWidth);

  this.setContent(this.tabs_[tab.index].content);
  this.updateContent_();

  this.activeTab_ = tab;

  this.redraw_();
};


/**
 * Set the max width of the InfoBubble
 *
 * @param {number} width The max width.
 */
InfoBubble.prototype.setMaxWidth = function(width) {
  this.set('maxWidth', width);
};
InfoBubble.prototype['setMaxWidth'] = InfoBubble.prototype.setMaxWidth;


/**
 * maxWidth changed MVC callback
 */
InfoBubble.prototype.maxWidth_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['maxWidth_changed'] =
    InfoBubble.prototype.maxWidth_changed;


/**
 * Set the max height of the InfoBubble
 *
 * @param {number} height The max height.
 */
InfoBubble.prototype.setMaxHeight = function(height) {
  this.set('maxHeight', height);
};
InfoBubble.prototype['setMaxHeight'] = InfoBubble.prototype.setMaxHeight;


/**
 * maxHeight changed MVC callback
 */
InfoBubble.prototype.maxHeight_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['maxHeight_changed'] =
    InfoBubble.prototype.maxHeight_changed;


/**
 * Set the min width of the InfoBubble
 *
 * @param {number} width The min width.
 */
InfoBubble.prototype.setMinWidth = function(width) {
  this.set('minWidth', width);
};
InfoBubble.prototype['setMinWidth'] = InfoBubble.prototype.setMinWidth;


/**
 * minWidth changed MVC callback
 */
InfoBubble.prototype.minWidth_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['minWidth_changed'] =
    InfoBubble.prototype.minWidth_changed;


/**
 * Set the min height of the InfoBubble
 *
 * @param {number} height The min height.
 */
InfoBubble.prototype.setMinHeight = function(height) {
  this.set('minHeight', height);
};
InfoBubble.prototype['setMinHeight'] = InfoBubble.prototype.setMinHeight;


/**
 * minHeight changed MVC callback
 */
InfoBubble.prototype.minHeight_changed = function() {
  this.redraw_();
};
InfoBubble.prototype['minHeight_changed'] =
    InfoBubble.prototype.minHeight_changed;


/**
 * Add a tab
 *
 * @param {string} label The label of the tab.
 * @param {string|Element} content The content of the tab.
 */
InfoBubble.prototype.addTab = function(label, content) {
  var tab = document.createElement('DIV');
  tab.innerHTML = label;

  this.setTabStyle_(tab);
  this.addTabActions_(tab);

  this.tabsContainer_.appendChild(tab);

  this.tabs_.push({
    label: label,
    content: content,
    tab: tab
  });

  tab.index = this.tabs_.length - 1;
  tab.style['zIndex'] = this.baseZIndex_ - tab.index;

  if (!this.activeTab_) {
    this.setTabActive_(tab);
  }

  tab.className = tab.className + ' ' + this.animationName_;

  this.redraw_();
};
InfoBubble.prototype['addTab'] = InfoBubble.prototype.addTab;

/**
 * Update a tab at a speicifc index
 *
 * @param {number} index The index of the tab.
 * @param {?string} opt_label The label to change to.
 * @param {?string} opt_content The content to update to.
 */
InfoBubble.prototype.updateTab = function(index, opt_label, opt_content) {
  if (!this.tabs_.length || index < 0 || index >= this.tabs_.length) {
    return;
  }

  var tab = this.tabs_[index];
  if (opt_label != undefined) {
    tab.tab.innerHTML = tab.label = opt_label;
  }

  if (opt_content != undefined) {
    tab.content = opt_content;
  }

  if (this.activeTab_ == tab.tab) {
    this.setContent(tab.content);
    this.updateContent_();
  }
  this.redraw_();
};
InfoBubble.prototype['updateTab'] = InfoBubble.prototype.updateTab;


/**
 * Remove a tab at a specific index
 *
 * @param {number} index The index of the tab to remove.
 */
InfoBubble.prototype.removeTab = function(index) {
  if (!this.tabs_.length || index < 0 || index >= this.tabs_.length) {
    return;
  }

  var tab = this.tabs_[index];
  tab.tab.parentNode.removeChild(tab.tab);

  google.maps.event.removeListener(tab.tab.listener_);

  this.tabs_.splice(index, 1);

  delete tab;

  for (var i = 0, t; t = this.tabs_[i]; i++) {
    t.tab.index = i;
  }

  if (tab.tab == this.activeTab_) {
    // Removing the current active tab
    if (this.tabs_[index]) {
      // Show the tab to the right
      this.activeTab_ = this.tabs_[index].tab;
    } else if (this.tabs_[index - 1]) {
      // Show a tab to the left
      this.activeTab_ = this.tabs_[index - 1].tab;
    } else {
      // No tabs left to sho
      this.activeTab_ = undefined;
    }

    this.setTabActive_(this.activeTab_);
  }

  this.redraw_();
};
InfoBubble.prototype['removeTab'] = InfoBubble.prototype.removeTab;


/**
 * Get the size of an element
 * @private
 * @param {Node|string} element The element to size.
 * @param {number=} opt_maxWidth Optional max width of the element.
 * @param {number=} opt_maxHeight Optional max height of the element.
 * @return {google.maps.Size} The size of the element.
 */
InfoBubble.prototype.getElementSize_ = function(element, opt_maxWidth,
                                                opt_maxHeight) {
  var sizer = document.createElement('DIV');
  sizer.style['display'] = 'inline';
  sizer.style['position'] = 'absolute';
  sizer.style['visibility'] = 'hidden';

  if (typeof element == 'string') {
    sizer.innerHTML = element;
  } else {
    sizer.appendChild(element.cloneNode(true));
  }

  document.body.appendChild(sizer);
  var size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);

  // If the width is bigger than the max width then set the width and size again
  if (opt_maxWidth && size.width > opt_maxWidth) {
    sizer.style['width'] = this.px(opt_maxWidth);
    size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);
  }

  // If the height is bigger than the max height then set the height and size
  // again
  if (opt_maxHeight && size.height > opt_maxHeight) {
    sizer.style['height'] = this.px(opt_maxHeight);
    size = new google.maps.Size(sizer.offsetWidth, sizer.offsetHeight);
  }

  document.body.removeChild(sizer);
  delete sizer;
  return size;
};


/**
 * Redraw the InfoBubble
 * @private
 */
InfoBubble.prototype.redraw_ = function() {
  this.figureOutSize_();
  this.positionCloseButton_();
  this.draw();
};


/**
 * Figure out the optimum size of the InfoBubble
 * @private
 */
InfoBubble.prototype.figureOutSize_ = function() {
  var map = this.get('map');

  if (!map) {
    return;
  }

  var padding = this.getPadding_();
  var borderWidth = this.getBorderWidth_();
  var borderRadius = this.getBorderRadius_();
  var arrowSize = this.getArrowSize_();

  var mapDiv = map.getDiv();
  var gutter = arrowSize * 2;
  var mapWidth = mapDiv.offsetWidth - gutter;
  var mapHeight = mapDiv.offsetHeight - gutter - this.getAnchorHeight_();
  var tabHeight = 0;
  var width = /** @type {number} */ (this.get('minWidth') || 0);
  var height = /** @type {number} */ (this.get('minHeight') || 0);
  var maxWidth = /** @type {number} */ (this.get('maxWidth') || 0);
  var maxHeight = /** @type {number} */ (this.get('maxHeight') || 0);

  maxWidth = Math.min(mapWidth, maxWidth);
  maxHeight = Math.min(mapHeight, maxHeight);

  var tabWidth = 0;
  if (this.tabs_.length) {
    // If there are tabs then you need to check the size of each tab's content
    for (var i = 0, tab; tab = this.tabs_[i]; i++) {
      var tabSize = this.getElementSize_(tab.tab, maxWidth, maxHeight);
      var contentSize = this.getElementSize_(tab.content, maxWidth, maxHeight);

      if (width < tabSize.width) {
        width = tabSize.width;
      }

      // Add up all the tab widths because they might end up being wider than
      // the content
      tabWidth += tabSize.width;

      if (height < tabSize.height) {
        height = tabSize.height;
      }

      if (tabSize.height > tabHeight) {
        tabHeight = tabSize.height;
      }

      if (width < contentSize.width) {
        width = contentSize.width;
      }

      if (height < contentSize.height) {
        height = contentSize.height;
      }
    }
  } else {
    var content = /** @type {string|Node} */ (this.get('content'));
    if (typeof content == 'string') {
      content = this.htmlToDocumentFragment_(content);
    }
    if (content) {
      var contentSize = this.getElementSize_(content, maxWidth, maxHeight);

      if (width < contentSize.width) {
        width = contentSize.width;
      }

      if (height < contentSize.height) {
        height = contentSize.height;
      }
    }
  }

  if (maxWidth) {
    width = Math.min(width, maxWidth);
  }

  if (maxHeight) {
    height = Math.min(height, maxHeight);
  }

  width = Math.max(width, tabWidth);

  if (width == tabWidth) {
    width = width + 2 * padding;
  }

  arrowSize = arrowSize * 2;
  width = Math.max(width, arrowSize);

  // Maybe add this as a option so they can go bigger than the map if the user
  // wants
  if (width > mapWidth) {
    width = mapWidth;
  }

  if (height > mapHeight) {
    height = mapHeight - tabHeight;
  }

  if (this.tabsContainer_) {
    this.tabHeight_ = tabHeight;
    this.tabsContainer_.style['width'] = this.px(tabWidth);
  }

  this.contentContainer_.style['width'] = this.px(width);
  this.contentContainer_.style['height'] = this.px(height);
};


/**
 *  Get the height of the anchor
 *
 *  This function is a hack for now and doesn't really work that good, need to
 *  wait for pixelBounds to be correctly exposed.
 *  @private
 *  @return {number} The height of the anchor.
 */
InfoBubble.prototype.getAnchorHeight_ = function() {
  var anchor = this.get('anchor');
  if (anchor) {
    var anchorPoint = /** @type google.maps.Point */(this.get('anchorPoint'));

    if (anchorPoint) {
      return -1 * anchorPoint.y;
    }
  }
  return 0;
};

InfoBubble.prototype.anchorPoint_changed = function() {
  this.draw();
};
InfoBubble.prototype['anchorPoint_changed'] = InfoBubble.prototype.anchorPoint_changed;


/**
 * Position the close button in the right spot.
 * @private
 */
InfoBubble.prototype.positionCloseButton_ = function() {
  var br = this.getBorderRadius_();
  var bw = this.getBorderWidth_();

  var right = 2;
  var top = 2;

  if (this.tabs_.length && this.tabHeight_) {
    top += this.tabHeight_;
  }

  top += bw;
  right += bw;

  var c = this.contentContainer_;
  if (c && c.clientHeight < c.scrollHeight) {
    // If there are scrollbars then move the cross in so it is not over
    // scrollbar
    right += 15;
  }

  this.close_.style['right'] = this.px(right);
  this.close_.style['top'] = this.px(top);
};
