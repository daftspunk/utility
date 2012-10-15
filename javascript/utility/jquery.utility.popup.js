/**
 * Popup widget
 *
 * Usage: 
 *   $('#popup').popup({ trigger: '#button' });
   * $('body').popup({ trigger: '#button', partial: 'partial:name' });
 */

;(function ($, window, document, undefined) {

    $.widget("utility.popup", {
        version: '1.1',
        options: {
            on_open:           null,           // Callback when popup opens
            on_close:          null,           // Callback when popup closes
            trigger:           null,           // Trigger to open
            extra_close:       '.popup_close', // Trigger to close
            show_close:        true,           // Show the X to close
            close_on_bg_click: true,           // If you click background close popup?
            move_to_element:   false,          // Move the popup to another element
            size:              null,           // Options: small, medium, large, xlarge, expand
            animation:         'fadeAndPop',   // Options: fade, fadeAndPop, none
            animation_speed:   300,            // Animate speed in milliseconds
            auto_reveal:       false,          // Show popup when page opens?
            partial:           null,           // Dynamically load a partial
            partial_data:      null            // Data to send along with the partial request
        },

        // Internals
        _partial_container_id: null,
        _partial_name: null,
        _reveal_options: { },


        _create: function () {

            if (this.element.is('body'))
                this.element = $('<div />').appendTo('body');

            this._reveal_options = {
                animation: this.options.animation,
                animationspeed: this.options.animation_speed,
                closeOnBackgroundClick: this.options.close_on_bg_click,
                dismissModalClass: 'close-reveal-modal'
            };

            this._partial_name = this.options.partial;

            this._build();
        },

        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        },

        _build: function() {

            var self = this;

            this.element.addClass('reveal-modal');
            if (this.options.size)
                this.element.addClass(this.options.size);

            // Auto reveal
            if (this.options.auto_reveal) {
                $(window).load(function(){ this.open_popup(); });   
            }

            // Popup opening
            var trigger = $(this.options.trigger);
            trigger.die('click').live('click', function() {
                self._handle_partial($(this));
                self.open_popup($(this));
            });

            // Popup closing
            this.element.find(this.options.extra_close).die('click').live('click', function() {
                self.element.trigger('reveal:close');
            });

            // Add close cross
            var close_cross = $('<a />').addClass('close-reveal-modal').html('&#215;');
            close_cross.appendTo(this.element);

            // Move the popup to a more suitable position
            if (this.options.move_to_element)
                this.element.prependTo($(this.options.move_to_element));  

        },

        // Service methods
        // 

        open_popup: function(triggered_by) {

            // Open event
            this.options.on_open && this.element.unbind('reveal:open').bind('reveal:open', function() {
                this.options.on_open(triggered_by);
            });

            // Close event
            this.options.on_close && this.element.unbind('reveal:close').bind('reveal:close', function() {
                this.options.on_close(triggered_by);
            });

            this.element.reveal(this._reveal_options);

        },

        close_popup: function() { 
            this.element.trigger('reveal:close'); 
        },

        // Partial Loading
        // 

        _handle_partial: function(triggered_by) {
            var inline_partial = triggered_by.data('partial');
            this._partial_name = (inline_partial) ? inline_partial : this.options.partial;

            if (this._partial_name) {
                this._partial_build_container();
                
                var container_id = '#' + this._partial_container_id,
                    update_object = { }; 
                    update_object[container_id] = this._partial_name;

                // Add ajax loader
                $(container_id).empty().append($('<div />').addClass('reveal-loading'));

                // Request partial content
                $('<form />').sendRequest('core:on_null', { update: update_object, extraFields: this.options.partial_data });
                //ahoy.post().update('#'+this._partial_container_id, this._partial_name).send();
            }

        },

        _partial_build_container: function() {
            // Container ID not found
            if (!this._partial_container_id) {
                var random_number = (Math.floor((Math.random() * 100)) % 94) + 33;
                this._partial_container_id = 'reveal-content'+random_number;
            }

            // Container not found, create
            if ($('#'+this._partial_container_id).length == 0)
                $('<div />').addClass('partial-reveal-modal').attr('id', this._partial_container_id).appendTo(this.element);
        }


    });

})( jQuery, window, document );
