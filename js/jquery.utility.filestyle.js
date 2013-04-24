/**
 * Applies style to input fields
 */

;(function ($, window, document, undefined) {

	$.widget("utility.filestyle", {
		version: '1.0.2',
		options: { 
			buttonText : 'Choose file',
			textField : true,
			icon : false,
			classButton : '',
			classText : '',
			classIcon : 'icon-folder-open'
		},

		_container: null,

		_init: function () { 

			// Sanity check
			if (this.element.attr('type') != "file")
				return;

			this.build();
		},

		build: function() { var self = this;
			
			self.element.data('filestyle', true);

			// Modify and wrap element
			self.element.css({
				position:'fixed',
				top:'-100px',
				left:'-100px'
			}).wrap('<div class="utility-filestyle" />');

			// Styled input html string
			var newInputStr = (this.options.textField  ? '<input type="text" class="'+this.options.classText+'" disabled size="40" /> ' : '')
				+ '<button type="button" class="btn '+this.options.classButton+'" >'
				+ (this.options.icon ? '<i class="'+this.options.classIcon+'"></i> ' : '')
				+ this.options.buttonText + '</button>'

			// Create container
			self._container = self.element.closest('.utility-filestyle');

			// Add style for bootstrap and input html
			self._container
				.addClass('form-search')
				.append(newInputStr);

			self.element.change(function () {
				self._container.children(':text').val($(this).val());
			});

			// Add event click
			self._container.children(':button').click(function () {
				self.element.click();
			});
		},

		clear: function() { var self = this;
			self._container.children(':text').val('');
			self.element.val('');
		},

		remove: function () {
			if (this._container)
				this._container.remove();
		}

	});

})( jQuery, window, document );
