;(function ($, window, document, undefined) {

	$.widget("utility.uploader", {
		version: '2.0.1',
		options: { 

			mode: 'single_image',       // Options: single_image|multi_image
			linkId: null,               // Upload link selector
			removeId: null,             // Remove image link selector
			paramName: 'image',         // POST parameter used for postbacks (use images[] for multi)
			extraData: null,            // Extra POST data to send with each request (defaults to parent form data)
			onRemove: null,             // Triggered when image is removed
			onSuccess: null,            // Triggered when image is uploaded
			onStart: null,              // Triggered when upload process starts
			onError: null,              // Triggered if there is an error
			hideInput: true,            // Hide the linked <input> element
			imageClass: '',             // Class to assign to uploaded image(s)

			// Single image specific (mode: single_image)
			imageId: '#upload_image',   // Image preview selector 
			allowReupload: true,        // Allow image overwrite 
			existingImgSrc: null,       // If image is already populated

			// Multi image specific (mode: multi_image)
			panelId:'#panel_photos',
			listItemClass: ''           // Class to assign to image list item
		},

		el_remove: null,
		el_image: null,
		el_panel: null,
		form_data: null,

		_create: function () { var self = this;
			
			this.el_image = $(this.options.imageId);

			if (this.options.removeId)
				this.el_remove = $(this.options.removeId);
			
			if (this.options.panelId)
				this.el_panel = $(this.options.panelId);

			if (this.options.linkId)
				$(this.options.linkId).click(function() { self.element.trigger('click'); });

			if (this.options.hideInput)
				this.element.css({ position:'absolute', visibility:'hidden' });

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
				paramName: this.options.paramName,
				type: 'POST',       
			}, uploader_options);

			if (this.options.extraData) {
				uploader_options.formData = function(form) {
					if (self.form_data)
						return self.form_data;

					data = form.serializeArray();
					$.each(self.options.extraData, function (name, value) {
						data.push({name: name, value: value});
					});

					return self.form_data = data;
				}
			}
			
			if (this.options.onStart)
				uploader_options.start = this.options.onStart;

			this.element.fileupload(uploader_options); 
		},

		// Single image
		// 

		bind_single_image_upload: function() { var self = this;
			this.bind_uploader({
				done: function (e, data) {
					self.add_single_image(data.result.thumb, data.result.id);
					self.options.onSuccess && self.options.onSuccess(self, data);
					self.options.allowReupload && self.bind_single_image_upload();   
				},            
				add: function(e, data) {
					self.el_image.fadeTo(500, 0);
					data.submit();
				},
				fail: function(e, data) {
					alert('Oops! Looks like there was an error uploading your photo, try a different one or send us an email! (' + data.errorThrown + ')')
					self.el_image.fadeTo(1000, 1);
					self.options.onError && self.options.onError(self, data);
				} 
			});

			if (!self.options.existingImgSrc)
				self.options.existingImgSrc = self.element.data('existing-image');

			if (self.options.existingImgSrc) 
				self.add_single_image(self.options.existingImgSrc);
		},

		bind_single_image_remove: function() { var self = this;
			if (self.el_remove) {
				self.el_remove.die('click').live('click', function(){

					self.el_remove.hide();
					
					var file_id = self.el_image.attr('data-image-id');
					if (!self.options.onRemove || (self.options.onRemove && (self.options.onRemove(self, file_id))!==false))  {
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
					self.options.onSuccess && self.options.onSuccess(self, data);
					self.bind_multi_image_upload();
				},            
				add: function(e, data) {
					self.el_panel.show().children('ul:first').append('<li class="'+self.options.listItemClass+'">'
						+ '<div class="thumbnail loading">'
						+ '<a href="javascript:;" class="remove">Remove</a>'
						+ '</div>'
						+ '</li>');
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
					self.options.onRemove && self.options.onRemove(self, file_id);

				});
			});
		},

		add_multi_image: function(src, id) { var self = this;
			var imageContainer = self.el_panel.find('div.loading:first');
			var image = $('<img />').attr('src', src).attr('alt', '')
				.addClass(this.options.imageClass);

			imageContainer.removeClass('loading').append(image);
				
			if (id)
				imageContainer.attr('data-image-id', id);
		}

	});

})( jQuery, window, document );
