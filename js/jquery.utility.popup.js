/**
 * Popup widget
 *
 * Usage: 
 *   $('#popup').popup({ trigger: '#button' });
 *   $('body').popup({ trigger: '#button', partial: 'partial:name' });
 */

;(function ($, window, document, undefined) {

	$.widget("utility.popup", {
		version: '2.0.2',
		options: {
			onOpen:            null,           // Callback when popup opens
			onClose:           null,           // Callback when popup closes
			trigger:           null,           // Trigger to open
			extraClose:        '.popup-close', // Trigger to close
			showClose:         true,           // Show the X to close
			closeOnEscPress:   true,          // If you press escape close popup?
			moveToElement:     false,          // Move the popup to another element
			size:              null,           // Options: small, medium, large, xlarge, expand
			autoReveal:        false,          // Show popup when page opens?
			
			// PHPR Specific
			action:            'on_action',    // PHPR AJAX Action
			partial:           null,           // Dynamically load a PHPR partial
			partialData:      null,           // Data to send along with the PHPR partial request
			cachePartial:     false           // Cache the PHPR partial content
		},

		// Internals
		_partial_container_id: null,
		_partial_name: null,
		_partial_loaded: false,
		_modal_options: { },

		_init: function () {
			if (this.element.is('body')) {
				var new_element = $('<div />').appendTo('body');
				new_element.popup(this.options);
				return;
			}

			this._modal_options = {
				keyboard: this.options.closeOnEscPress				
			};

			this._partial_name = this.options.partial;

			this._build();
		},

		destroy: function () {
			$.Widget.prototype.destroy.call(this);
		},

		_build: function() {

			var self = this;

			this.element.addClass('modal');
			if (this.options.size)
				this.element.addClass(this.options.size);

			// Popup opening
			if (this.options.trigger) {
				var trigger = $(this.options.trigger);

				trigger.die('click.utility.popup')
					.live('click.utility.popup', function() {
						self._handle_partial($(this));
						self.openPopup($(this));
					});
			}

			// Popup closing
			this.element.find(this.options.extraClose).off('click.utility.popup')
				.on('click.utility.popup', function() {
					self.closePopup();
				});

			// Add close cross
			var closeCross = $('<a />').addClass('close')				
				.data('dismiss', 'modal').html('&#215;')
				.on('click.utility.popup', function() { self.closePopup(); });

			var crossContainer = this.element.find('.modal-header');

			if (crossContainer.length > 0)
				closeCross.prependTo(crossContainer);
			else
				closeCross.prependTo(this.element.find('.modal-body'));

			// Move the popup to a more suitable position
			if (this.options.moveToElement)
				this.element.prependTo($(this.options.moveToElement));  

			// Auto reveal
			if (this.options.autoReveal) {
				self._handle_partial($(this));
				self.openPopup($(this));
			}

		},

		// Service methods
		// 

		openPopup: function(triggered_by) { var self = this;

			// Open event
			this.options.onOpen && this.element.off('shown').on('shown', function() { 
				self.options.onOpen.apply(self, [triggered_by]);
			});

			// Close event
			this.options.onClose && this.element.off('hide').on('hide', function() { 
				self.options.onClose.apply(self, [triggered_by]);
			});

			this.element.modal(this._modal_options);
			
			// Reset cache if necessary
			this.element.bind('hide', function(){ 
				if (!self.options.cachePartial)
					self.reset_cache();
			}); 

		},

		closePopup: function() { 
			this.element.modal('hide');
		},

		// Partial Loading
		// 

		reset_cache: function() {
			$('#'+this._partial_container_id).attr('rel', '');
			this._partial_loaded = false;
		},

		_handle_partial: function(triggered_by) { var self = this;
			var inline_partial = triggered_by.data('partial');
			this._partial_name = (inline_partial) ? inline_partial : this.options.partial;

			if (this._partial_name) {
				this._partial_build_container();
				
				var container_id = '#' + this._partial_container_id,
					update_object = { }; 
					update_object[container_id] = this._partial_name;

				// Halt here for partial cache
				if (this.options.cachePartial && this._partial_loaded) {
					// @todo This will pollute the DOM with it's leftover
					// reveal containers, should clean these up
					$(container_id).appendTo(this.element);
					return;
				}
				
				// Add ajax loader
				$(container_id).empty().append($('<div />').addClass('modal-popup-loading'));
				
				// Request partial content
				$('<form />').sendRequest(self.options.action, { 
					update: update_object, 
					extraFields: this.options.partialData,
					onSuccess: function() { 
						$(container_id)
							.addClass('partial-content-loaded')
							.attr('rel', self._partial_name);

						self._partial_loaded = true;
					}
				});
			}

		},

		_partial_build_container: function() {

			// Look for a cached partial container
			if (this.options.cachePartial) {
				var existing_partial = $('div[rel="'+this._partial_name+'"]');
				if (existing_partial.length > 0 && existing_partial.hasClass('modal-content-partial')) {
					this._partial_container_id = existing_partial.attr('id');
					this._partial_loaded = true;
					return;
				}
			}

			// Container ID not found
			if (!this._partial_container_id) {
				var random_number = (Math.floor((Math.random() * 100)) % 94) + 33;
				this._partial_container_id = 'modal-content'+random_number;
			}

			// Container not found, create
			if ($('#'+this._partial_container_id).length == 0) {
				$('<div />').addClass('modal-content-partial')
					.attr('id', this._partial_container_id)
					.appendTo(this.element);
			}
		}

	});

})( jQuery, window, document );
