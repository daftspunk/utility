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

		version: '2.0.0',
		options: {
			thumb_mode: 'carousel', // carousel|orbit
			thumb_width: 75,
			thumb_height: 75,
			use_popup: true // Display full size images in a popup
		},

		_element_id: null,
		_popup: null,
		_popup_id: null,
		_thumb_list: null, // Object to store thumb list


		_create: function () { var _this = this;			
			this._element_id = this.element.attr('id');
			this._popup_id = this._element_id+'_popup';

			// First lets clean up
			$('#'+this._popup_id).remove();

			// Then dress up
			this.element.wrap($('<div />').attr('id', this._popup_id));
			this._popup = $('#'+this._popup_id);

			// Init thumbs
			if (this.options.thumb_mode == 'carousel')
				_this._init_carousel_thumbs();
			else if (this.options.thumb_mode == 'orbit')
				_this._init_orbit_thumbs();

			// If we have no images, do not proceed
			if (!this.element.find('img').length)
				return;

			// Init Orbit
			this.element.not('.orbit-enabled').addClass('orbit-enabled').orbit({
				animation: 'horizontal-push',
				bullets: this.options.use_popup,
				captions: true,
				directionalNav: this.options.use_popup,
				fluid: true,
				timer: false
			});

			// Popup
			this._init_popup();

		},

		// Build thumbs for carousel
		_init_carousel_thumbs: function() { var _this = this;
			this._thumb_list = $('<ul />').attr('id', this._element_id+'_thumbs').addClass('jcarousel-skin-ahoy');
			this.element.find('img').each(function(key, val){
				var image_id = $(this).attr('data-image-id');
				var thumb_src = $(this).attr('data-image-thumb');
				var anchor = $('<a />').attr({
					href: 'javascript:;',
					'data-image-count': key
				});
				var thumb = $('<img />').attr({
					src: thumb_src,
					'data-image-id': image_id,
					width: _this.options.thumb_width,
					height: _this.options.thumb_height
				});
				var thumb_list_anchor = anchor.append(thumb);
				_this._thumb_list.append($('<li />').append(thumb_list_anchor));
			});
			this._popup.after(this._thumb_list);
			_this._thumb_list.jcarousel({ scroll: 1 });
		},

		// Build thumbs for orbit
		_init_orbit_thumbs: function() { var _this = this;
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
					//width: _this.options.thumb_width,
					//height: _this.options.thumb_height
				});
				var thumb_list_anchor = anchor.append(thumb);
				_this._thumb_list.append(thumb_list_anchor);
			});
			this._popup.after(this._thumb_list);
			_this._thumb_list.orbit({ 
				timer:true, 
				directionalNav:false, 
				bullets:true 
			});
		},

		_init_popup: function() { var _this = this;
			if (this.options.use_popup) {
				this._popup.popup({ 
					trigger: '#'+this._element_id+'_thumbs a',
					move_to_element: 'body',
					size: 'portfolio',
					on_open: function(link) {
						_this.click_thumb(link);
					}
				});
			} else {
				$('#'+this._element_id+'_thumbs a').click(function() {
					_this.click_thumb($(this));
				});
			}
		},

		// When a thumb is clicked
		click_thumb: function(link) {
			var image_id = $(link).attr('data-image-count');
			if (image_id)
					this.element.trigger('orbit.goto', [image_id]);
		},

		destroy: function() {
			$.Widget.prototype.destroy.call(this);
			this._popup.remove();
		}
		});

})( jQuery, window, document );