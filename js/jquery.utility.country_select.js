/**
 * Select country behavior
 * 
 * Usage: 
 *   $('#country').countrySelect({ container: '#billing_states', partial: 'control:state_selector' });
 */

;(function ($, window, document, undefined) {

	$.widget("utility.countrySelect", {
		version: '1.0.2',
		options: {
			afterUpdate: null,    // Callback after state has updated

			// Standard usage     - where the action renders a partial
			partial: null,        // Use partial instead of direct result
			container: null,      // If using a partial, which container to populate

			// Direct usage       - where the action prints a new select element
			stateElementId: null  // Element ID or element to replace
		},

		stateElement: null,

		_init: function() { var self = this;

			this.stateElement = $(this.options.stateElementId);

			this.element.on('change', function() {

				var postObj = $(self.element).phpr().post()
					.action('location:on_state_dropdown')
					.data('country_id', self.element.val())
					.success(function(response){
						if (!self.options.partial)
							self.stateElement.replaceWith(response.html);
						
						self.options.afterUpdate && self.options.afterUpdate(self);
					});

				if (self.options.partial)
					postObj.update(self.options.container, self.options.partial);

				if (self.stateElement.attr('name'))
					postObj = postObj.data('control_name', self.stateElement.attr('name'))

				if (self.stateElement.attr('id'))
					postObj = postObj.data('control_id', self.stateElement.attr('id'));

				postObj.send();
				
			});
		}

	})

})( jQuery, window, document );
