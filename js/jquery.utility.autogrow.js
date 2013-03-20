
/**
 * Autogrow Textarea
 */

;(function ($, window, document, undefined) {

	$.widget("utility.autogrow", {
		version: '1.0.0',
		options: { 
			offset: 30  // Height offset
		},

		minHeight: null,
		lineHeight: null,
		shadow: null,

		_init: function () { 
			var element = this.element;

			this.minHeight = element.height();
			this.lineHeight = element.css('line-height');
			this.shadow = $('<div></div>');

			this.shadow.css({
				position: 'absolute',
				top: -10000,
				left: -10000,
				width: element.width(),
				fontSize: element.css('font-size'),
				fontFamily: element.css('font-family'),
				lineHeight: element.css('line-height'),
				resize: 'none'
			}).appendTo(document.body);

		    element.on('change keyup keydown', $.proxy(this.updateArea, this));
		    this.updateArea();			
		},

		updateArea: function () {
			var val = this.element.val().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/\n/g, '<br/>');
			this.shadow.html(val);
			this.element.css('height', Math.max(this.shadow.height() + this.options.offset, this.minHeight));
		},

        destroy: function () { 
        	this.off('change keyup keydown', $.proxy(this.updateArea, this));
            $.Widget.prototype.destroy.call(this);
        }

	});

})( jQuery, window, document );
