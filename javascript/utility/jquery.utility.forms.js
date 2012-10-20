
/**
 * Custom Forms Widget
 */

;(function ($, window, document, undefined) {

    $.widget("utility.forms", {
        version: '1.0.0',
        options: { },

        _create: function () { 
            this.refresh();
        },

        refresh: function() {
            this.build_quantity_input();
        },

        // Quantity Control
        //

        build_quantity_input: function() { var _this = this;
            var inputs = $('input.input-quantity').not('.input-quantity-ready').addClass('input-quantity-ready');
            inputs.each(function() {
                var element = $(this);
                
                var up_arrow = $('<a />')
                    .addClass('arrow up')
                    .append('<span>Up</span>')
                    .attr('href', 'javascript:;');
                
                var down_arrow = $('<a />')
                    .addClass('arrow down')
                    .append('<span>Down</span>')
                    .attr('href', 'javascript:;');
                
                element.wrap($('<span />').addClass('custom quantity'))
                    .after(down_arrow)
                    .after(up_arrow);

                element.closest('span.custom.quantity')
                    .find('.arrow')
                    .click(_this._click_quantity_input);
            });
        },

        _click_quantity_input: function() {
            var element = $(this);
            var quantity = 1;
            var input_field = element
                .closest('span.custom.quantity')
                .find('input.input-quantity');

            var value = parseInt(input_field.val());

            if (isNaN(value))
                value = 0;

            if (element.hasClass('up'))
                value++;
            else
                value--;

            input_field.val(Math.max(value,0));
            input_field.trigger('change');
        }

    });

})( jQuery, window, document );
