/**
 * Portfolio behavior
 *
 * Usage:
 * <div id="portfolio">
 *   <img src="fullsize.jpg" data-image-id="1" data-image-thumb="thumb.jpg" />
 *   <img src="fullsize2.jpg" data-image-id="1" data-image-thumb="thumb2.jpg" />
 * </div>
 * <script> $('portfolio').portfolio(); </script>
 *
 */

;(function ($, window, document, undefined) {

	$.widget("utility.portfolio", {

		version: '2.0.2',
		options: {
			thumbMode: 'thumbs', // thumbs|slider
			thumbWidth: 75,
			thumbHeight: 75,
			usePopup: true // Display full size images in a popup
		},

		_element_id: null,
		_popup: null,
		_popup_id: null,
		_thumb_list: null, // Object to store thumb list

		_create: function () { var self = this;			
			this._element_id = this.element.attr('id');
			this._popup_id = this._element_id+'_popup';

			// First lets clean up
			$('#'+this._popup_id).remove();

			// Then dress up
			this.element.wrap($('<div />').attr('id', this._popup_id));
			this._popup = $('#'+this._popup_id);

			// Init thumbs
			if (this.options.thumbMode == 'thumbs')
				self._init_thumbs_mode();
			else if (this.options.thumbMode == 'slider')
				self._init_slider_mode();

			// If we have no images, do not proceed
			if (!this.element.find('img').length)
				return;

			// Init Slider
			// (auto init by framework)

			// Popup
			this._init_popup();

		},

		// Build thumbs for carousel
		_init_thumbs_mode: function() { var self = this;
			this._thumb_list = $('<ul />').attr('id', this._element_id+'_thumbs').addClass('jcarousel-skin-ahoy');
			this.element.find('img').each(function(key, val){
				var image_id = $(this).data('image-id');
				var thumb_src = $(this).data('image-thumb');
				var anchor = $('<a />').attr({
					href: 'javascript:;',
					'data-image-count': key
				});
				var thumb = $('<img />').attr({
					src: thumb_src,
					'data-image-id': image_id,
					width: self.options.thumbWidth,
					height: self.options.thumbHeight
				});
				var thumb_list_anchor = anchor.append(thumb);
				self._thumb_list.append($('<li />').append(thumb_list_anchor));
			});
			this._popup.after(this._thumb_list);
			self._thumb_list.jcarousel({ scroll: 1 });
		},

		// Build thumbs for orbit
		_init_slider_mode: function() { var self = this;
			this._thumb_list = $('<div />').attr('id', this._element_id+'_thumbs');
			this.element.find('img').each(function(key, val){
				var image_id = $(this).attr('data-image-id');
				var thumb_src = $(this).attr('data-image-thumb');
				var anchor = $('<a />').attr({
					href: 'javascript:;',
					'data-image-count': key
				});
				var thumb = $('<img />').attr({
					src: thumb_src,
					'data-image-id': image_id
					//width: self.options.thumbWidth,
					//height: self.options.thumbHeight
				});
				var thumb_list_anchor = anchor.append(thumb);
				self._thumb_list.append(thumb_list_anchor);
			});
			this._popup.after(this._thumb_list);
			self._thumb_list.orbit({ 
				timer:true, 
				directionalNav:false, 
				bullets:true 
			});
		},

		_init_popup: function() { var self = this;
			if (this.options.usePopup) {

				this._popup.addClass('modal hide fade')
					.wrapInner('<div class="modal-body" />');

				// Allow room for the close icon
				this.element.css('margin-top', '20px');

				this._popup.popup({ 
					trigger: '#'+this._element_id+'_thumbs a',
					moveToElement: 'body',
					size: 'portfolio',
					onOpen: function(link) {
						self.click_thumb(link);
					}
				});
			} else {
				$('#'+this._element_id+'_thumbs a').click(function() {
					self.click_thumb($(this));
				});
			}
		},

		// When a thumb is clicked
		click_thumb: function(link) {
			var image_id = $(link).attr('data-image-count');
			image_id = parseInt(image_id);
			if (!isNaN(image_id))
					this.element.carousel(image_id);
		},

		destroy: function() {
			$.Widget.prototype.destroy.call(this);
			this._popup.remove();
		}
	});

})( jQuery, window, document );