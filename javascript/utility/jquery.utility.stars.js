/** 
 * Star widget
 *
 * Usage:
 * <div class="rating-selector">
 *     <select name="rating">
 *         <option value="0">0</option>
 *         <option value="1">1</option>
 *         <option value="2">2</option>
 *         <option value="3">3</option>
 *         <option value="4">4</option>
 *         <option value="5">5</option>
 *     </select>
 * </div>
 * $('.rating-selector').stars({
 *   input_type: "select",
 *   cancel_value: 0,
 *   cancel_show: false
 * });
 *
 */
;(function ($, window, document, undefined) {

    $.widget('utility.star_rating', {
        options: {
            version: '1.0.0',
            input_type: 'select',          // Input element used (select, radio)
            split: 0,                      // Decrease number of stars by splitting each star into pieces [2|3|4|...]
            disabled: false,               // Set to [true] to make the stars initially disabled
            cancel_title: 'Cancel Rating', // Cancel title value
            cancel_value: 0,               // Default value of Cancel button
            cancel_show: false,            // Show cancel
            disabled_value: false,         // Set to [false] to not disable the hidden input when Cancel btn is clicked, so the value will present in POST data.
            default_value: false,          // Default value
            one_vote_only: false,          // Allow one vote only
            show_titles: false,            // Show titles
            el_caption: null,              // jQuery object - target for text captions 
            callback: null,                // function(ui, type, value, event)
            force_select: null,

            // CSS Classes
            star_width: 16, // width of the star image
            container_class: 'star-rating',
            cancel_class: 'cancel',
            star_off_class: 'star',
            star_on_class: 'star-on',
            star_hover_class: 'star-hover',
            star_disabled_class: 'star-disabled',
            cancel_hover_class: 'cancel-hover',
            cancel_disabled_class: 'cancel-disabled'
        },

        // Internals
        _form: null,
        _select: null,
        _rboxes: null,
        _cancel: null,
        _stars: null,
        _value: null,
        
        _create: function() {
            var self = this;
            var o = this.options;
            var star_id = 0;

            this.element
                .data('former.stars', this.element.html())
                .addClass(o.container_class);

            o.isSelect = o.input_type == 'select';
            this._form = $(this.element).closest('form');
            this._select = o.isSelect 
                ? $('select', this.element) 
                : null;

            this._rboxes = o.isSelect 
                ? $('option', this._select) 
                : $(':radio', this.element);

            // Map all inputs from rboxes array to Stars elements
            this._stars = this._rboxes.map(function(i)
            {
                var el = {
                    value: this.value,
                    title: (o.isSelect ? this.text : this.title) || this.value,
                    is_default: (o.isSelect && this.defaultSelected) || this.defaultChecked
                };

                if (i==0) {
                    o.split = typeof o.split != 'number' ? 0 : o.split;
                    o.val2id = [];
                    o.id2val = [];
                    o.id2title = [];
                    o.name = o.isSelect ? self._select.get(0).name : this.name;
                    o.disabled = o.disabled || (o.isSelect ? $(self._select).attr('disabled') : $(this).attr('disabled'));
                }

                // Consider it as a Cancel button?
                if (el.value == o.cancel_value) {
                    o.cancel_title = el.title;
                    return null;
                }

                o.val2id[el.value] = star_id;
                o.id2val[star_id] = el.value;
                o.id2title[star_id] = el.title;

                if (el.is_default) {
                    o.checked = star_id;
                    o.value = o.default_value = el.value;
                    o.title = el.title;
                }

                var $s = $('<div/>').addClass(o.star_off_class);
                var $a = $('<a/>').attr('title', o.show_titles ? el.title : '').text(el.value);

                // Prepare division settings
                if (o.split) {
                    var oddeven = (star_id % o.split);
                    var stwidth = Math.floor(o.star_width / o.split);
                    $s.width(stwidth);
                    $a.css('margin-left', '-' + (oddeven * stwidth) + 'px');
                }

                star_id++;
                return $s.append($a).get(0);
            });

            // How many Stars?
            o.items = star_id;

            // Remove old content
            o.isSelect ? this._select.remove() : this._rboxes.remove();

            // Append Stars interface
            this._cancel = $('<div/>').addClass(o.cancel_class).append( $('<a/>').attr('title', o.show_titles ? o.cancel_title : '').text(o.cancel_value) );
            o.cancel_show &= !o.disabled && !o.one_vote_only;
            o.cancel_show && this.element.append(this._cancel);
            this.element.append(this._stars);

            // Initial selection
            if (o.checked === undefined) {
                o.checked = -1;
                o.value = o.default_value = o.cancel_value;
                o.title = '';
            }
            
            // The only FORM element, that has been linked to the stars control. The value field is updated on each Star click event
            this._value = $('<input type="hidden" name="'+o.name+'" value="'+o.value+'" />');
            this.element.append(this._value);

            // Attach stars event handler
            this._stars.bind('click.stars', function(e) {
                if (!o.force_select && o.disabled) return false;

                var i = self._stars.index(this);
                o.checked = i;
                o.value = o.id2val[i];
                o.title = o.id2title[i];
                self._value.attr({disabled: o.disabled ? 'disabled' : false, value: o.value});

                fill_to(i, false);
                self._disable_cancel();

                !o.force_select && self.callback(e, 'star');
            })
            .bind('mouseover.stars', function() {
                if (o.disabled) return false;
                var i = self._stars.index(this);
                fill_to(i, true);
            })
            .bind('mouseout.stars', function() {
                if (o.disabled) return false;
                fill_to(self.options.checked, false);
            });


            // Attach cancel event handler
            this._cancel.bind('click.stars', function(e) {
                if (!o.force_select && (o.disabled || o.value == o.cancel_value)) return false;

                o.checked = -1;
                o.value = o.cancel_value;
                o.title = '';
                
                self._value.val(o.value);
                o.disabled_value && self._value.attr({disabled: 'disabled'});

                fill_none();
                self._disable_cancel();

                !o.force_select && self.callback(e, 'cancel');
            })
            .bind('mouseover.stars', function() {
                if (self._disable_cancel()) return false;
                self._cancel.addClass(o.cancel_hover_class);
                fill_none();
                self._showCap(o.cancel_title);
            })
            .bind('mouseout.stars', function() {
                if (self._disable_cancel()) return false;
                self._cancel.removeClass(o.cancel_hover_class);
                self._stars.triggerHandler('mouseout.stars');
            });

            // Attach onReset event handler to the parent FORM
            this._form.bind('reset.stars', function(){
                !o.disabled && self.select(o.default_value);
            });

            // Star selection helpers
            function fill_to(index, hover) {
                if (index != -1) {
                    var addClass = hover ? o.star_hover_class : o.star_on_class;
                    var remClass = hover ? o.star_on_class    : o.star_hover_class;
                    self._stars.eq(index).prevAll('.' + o.star_off_class).andSelf().removeClass(remClass).addClass(addClass);
                    self._stars.eq(index).nextAll('.' + o.star_off_class).removeClass(o.star_hover_class + ' ' + o.star_on_class);
                    self._showCap(o.id2title[index]);
                }
                else fill_none();
            };
            function fill_none() {
                self._stars.removeClass(o.star_on_class + ' ' + o.star_hover_class);
                self._showCap('');
            };

            // Finally, set up the Stars
            this.select(o.value);
            o.disabled && this.disable();
        },

        // Private functions
        _disable_cancel: function() {
            var o = this.options, disabled = o.disabled || o.one_vote_only || (o.value == o.cancel_value);
            if (disabled)  this._cancel.removeClass(o.cancel_hover_class).addClass(o.cancel_disabled_class);
            else          this._cancel.removeClass(o.cancel_disabled_class);
            this._cancel.css('opacity', disabled ? 0.5 : 1);
            return disabled;
        },
        _disable_all: function() {
            var o = this.options;
            this._disable_cancel();
            if (o.disabled)
                this._stars.filter('div').addClass(o.star_disabled_class);
            else
                this._stars.filter('div').removeClass(o.star_disabled_class);
        },
        _showCap: function(s) {
            var o = this.options;
            if (o.el_caption) o.el_caption.text(s);
        },

        // Public functions
        value: function() {
            return this.options.value;
        },
        select: function(val) {
            var o = this.options, e = (val == o.cancel_value) ? this._cancel : this._stars.eq(o.val2id[val]);
            o.force_select = true;
            e.triggerHandler('click.stars');
            o.force_select = false;
        },
        select_id: function(id) {
            var o = this.options, e = (id == -1) ? this._cancel : this._stars.eq(id);
            o.force_select = true;
            e.triggerHandler('click.stars');
            o.force_select = false;
        },
        enable: function() {
            this.options.disabled = false;
            this._disable_all();
        },
        disable: function() {
            this.options.disabled = true;
            this._disable_all();
        },
        destroy: function() {
            this._form.unbind('.stars');
            this._cancel.unbind('.stars').remove();
            this._stars.unbind('.stars').remove();
            this._value.remove();
            this.element.unbind('.stars').html(this.element.data('former.stars')).removeData('stars');
            return this;
        },
        callback: function(e, type) {
            var o = this.options;
            o.callback && o.callback(this, type, o.value, e);
            o.one_vote_only && !o.disabled && this.disable();
        }
    });

})( jQuery, window, document );
