;(function ($, window, document, undefined) {

	$.widget("utility.uploader", {
		version: '2.0.0',
		options: { 

			mode: 'single_image',      // Options: single_image|multi_image
			link_id: null,             // Upload link selector
			remove_id: null,           // Remove image link selector
			param_name: 'image',       // POST parameter used for postbacks (use images[] for multi)
			extra_data: null,          // Extra POST data to send with each request (defaults to parent form data)
			on_remove: null,           // Triggered when image is removed
			on_success: null,          // Triggered when image is uploaded
			on_start: null,            // Triggered when upload process starts
			on_error: null,            // Triggered if there is an error
			
			// Single image specific (mode: single_image)
			image_id: '#upload_image', // Image preview selector 
			allow_reupload: true,      // Allow image overwrite 
			existing_img_src: null,    // If image is already populated

			// Multi image specific (mode: multi_image)
			panel_id:'#panel_photos'
		},

		el_remove: null,
		el_image: null,
		el_panel: null,
		form_data: null,

		_create: function () { var self = this;
			
			this.el_image = $(this.options.image_id);

			if (this.options.remove_id)
				this.el_remove = $(this.options.remove_id);
			
			if (this.options.panel_id)
				this.el_panel = $(this.options.panel_id);

			if (this.options.link_id)
				$(this.options.link_id).click(function() { self.element.trigger('click'); });

			if (this.options.mode == 'single_image') {
				this.bind_single_image_upload();
				this.bind_single_image_remove();            
			} else if (this.options.mode == 'multi_image') {
				this.bind_multi_image_upload();
				this.bind_multi_image_remove();            
			}
		},

		// Generic helper. Binds the uploader plugin with default properties
		bind_uploader: function(uploader_options) { var self = this;

			uploader_options = $.extend(true, {
				dataType: 'json',
				//url: '',
				paramName: this.options.param_name,
				type: 'POST',       
			}, uploader_options);

			if (this.options.extra_data) {
				uploader_options.formData = function(form) {
					if (self.form_data)
						return self.form_data;

					data = form.serializeArray();
					$.each(self.options.extra_data, function (name, value) {
						data.push({name: name, value: value});
					});

					return self.form_data = data;
				}
			}
			
			if (this.options.on_start)
				uploader_options.start = this.options.on_start;

			this.element.fileupload(uploader_options); 
		},

		// Single image
		// 

		bind_single_image_upload: function() { var self = this;
			this.bind_uploader({
				done: function (e, data) {
					self.add_single_image(data.result.thumb, data.result.id);
					self.options.on_success && self.options.on_success(self, data);
					self.options.allow_reupload && self.bind_single_image_upload();   
				},            
				add: function(e, data) {
					self.el_image.fadeTo(500, 0);
					data.submit();
				},
				fail: function(e, data) {
					alert('Oops! Looks like there was an error uploading your photo, try a different one or send us an email! (' + data.errorThrown + ')')
					self.el_image.fadeTo(1000, 1);
					self.options.on_error && self.options.on_error(self, data);
				} 
			});

			if (!self.options.existing_img_src)
				self.options.existing_img_src = self.element.data('existing-image');

			if (self.options.existing_img_src) 
				self.add_single_image(self.options.existing_img_src);
		},

		bind_single_image_remove: function() { var self = this;
			if (self.el_remove) {
				self.el_remove.die('click').live('click', function(){

					self.el_remove.hide();
					
					var file_id = self.el_image.attr('data-image-id');
					if (!self.options.on_remove || (self.options.on_remove && (self.options.on_remove(self, file_id))!==false))  {
						self.el_image.fadeTo(500, 0, function() {
							var blank_src = self.el_image.attr('data-blank-src');
							if (blank_src) {
								self.el_image.attr('src', blank_src);
								self.el_image.fadeTo(1000, 1);
							}
						});
					}

				});
			}
		},

		add_single_image: function(src, id) { var self = this;
			var old_src = self.el_image.attr('src');
			
			self.el_image.attr('src', src)
				.attr('data-blank-src', old_src)
				.fadeTo(1000, 1);
			
			if (id)
				self.el_image.attr('data-image-id', id)

			self.el_remove && self.el_remove.show();
		},

		// Multiple images
		// 

		bind_multi_image_upload: function() { var self = this;
			this.bind_uploader({
				done: function (e, data) {
					self.add_multi_image(data.result.thumb, data.result.id);
					self.options.on_success && self.options.on_success(self, data);
					self.bind_multi_image_upload();
				},            
				add: function(e, data) {
					self.el_panel.show().children('ul:first').append('<li><div class="image loading"><a href="javascript:;" class="remove">Remove</a></div></li>');
					data.submit();
				}
			}); 
		},

		bind_multi_image_remove: function() { var self = this;
			self.el_panel.find('a.remove').die('click').live('click', function(){
				var photo = $(this).parent();
				$(this).closest('li').fadeOut(function() { 
					$(this).remove() 
					if (self.el_panel.find('li').length == 0)
						self.el_panel.hide();

					var file_id = photo.attr('data-image-id');
					self.options.on_remove && self.options.on_remove(self, file_id);

				});
			});
		},

		add_multi_image: function(src, id) {
			var image = self.el_panel.find('div.loading:first');
			image.removeClass('loading').css('background-image', 'url('+src+')');

			if (id)
				image.attr('data-image-id', id);
		}

	});

})( jQuery, window, document );
