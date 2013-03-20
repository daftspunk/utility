
/**
 * Statusbar widget
 *
 * Usage: 
 *   $(document).statusbar('option', {position: 'top', context: 'success', time: 999999, message: 'You successfully read this message!'});
 *   
 */

;(function ($, window, document, undefined) {

	$.widget("utility.statusbar", {
		version: '1.0.4',
		options: {
			inject_to:  'body', // Element to prepend bar to
			message:    '',     // Message to display in bar
			context:    'info', // Message context (info, error, success, notice)
			position:   'top',  // Bar location (top|bottom)
			show_close: false,  // Show the X to close 
			time:       5000    // Duration
		},

		_timer: null,
		_bar: null,
		_message: null,
		_close_link: null,
		_is_visible: false,

		_create: function () { var self = this;
			this._message = $('<span />')
				.addClass('bar-content');

			this._bar = $('<div />')
				.addClass('status-bar')
				.addClass(this.options.context)
				.addClass((this.options.position == 'bottom') ? 'bar-bottom' : 'bar-top');

			if (this.options.show_close) {
				this._close_link = $('<a />')
					.addClass('bar-close')
					.click(function() { self.removeMessage(); });
			} else {
				this._bar
					.css('cursor', 'pointer')
					.click(function() { self.removeMessage(); });
			}

			this._bar
				.append(this._message)
				.append(this._close_link)
				.hide()
				.prependTo(this.options.inject_to);
		},

		_setOption: function(key, value) {
			switch (key) {
				case "position":
					if (value=='bottom')
						this._bar.removeClass('bar-top').addClass('bar-bottom');
					else
						this._bar.removeClass('bar-bottom').addClass('bar-top');
					break;
				case "context":
					this._bar
						.removeClass('info success warning error')
						.addClass(value);
					break;
				case "message":
					this.show_message(value);
					break;
			}
			this.options[key] = value;
		},

		destroy: function () { 
			$.Widget.prototype.destroy.call(this);
		},

		show_message: function(message, params) { var self = this; 
			this._set_timer();
			this._message.html(message);
			
			// if (self._is_visible)
			//     return;

			self._is_visible = true;
			this._bar.stop(true, true).fadeIn('fast', function() { self._is_visible = true; });
		},

		_set_timer: function() { var self = this;
			if (this._timer)
				this._clear_timer();

			this._timer = setTimeout(function() { self.removeMessage(); }, this.options.time);
		},

		_clear_timer: function() {
			clearTimeout(this._timer);
		},

		removeMessage: function() { var self = this; 
			if (self._is_visible) {
				self._clear_timer();
				self._bar.stop(true, true).fadeOut('fast', function() {
					self._is_visible = false;
				});
			}
		}

	});

})( jQuery, window, document );
