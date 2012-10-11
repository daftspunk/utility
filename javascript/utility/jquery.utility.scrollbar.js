;(function ($, window, document, undefined) {

    $.widget("utility.scrollbar", {
        version: '1.0',
        options: {
            axis:         'vertical', // Vertical or horizontal scrollbar?
            wheel:        40,         // How many pixels to scroll at a time
            scroll:       true,       // Enable or disable the mousewheel
            lockscroll:   true,       // Return scrollwheel to browser if there is no more content
            size:         'auto',     // Set the size of the scrollbar to auto or a fixed number
            sizethumb:    'auto',     // Set the size of the thumb to auto or a fixed number
            invertscroll: false       // Enable mobile invert style scrolling
        },

        _viewport: null,
        _content: null,
        _scrollbar: null,
        _track: null,
        _thumb: null,
        _scroll_axis: null,
        _scroll_direction: null,
        _scroll_size: null,
        _scroll_obj: 0,
        _position_obj: { start: 0, now: 0 },
        _mouse_obj: {},
        _is_visible: false,

        _create: function () { var _this = this;
            this._build_elements();
            
            this._scroll_axis = (this.options.axis === 'horizontal');
            this._scroll_direction = this._scroll_axis ? 'left' : 'top';
            this._scroll_size = this._scroll_axis ? 'Width' : 'Height';

            this.update();
            this._bind_events();
        },

        destroy: function () { 
            $.Widget.prototype.destroy.call(this);
        },

        update: function(scroll) {
            this._viewport.obj.css({ width: (this.element.outerWidth() - (this._scroll_axis ? 0 : 20)) + "px", height: (this.element.outerHeight() - (this._scroll_axis ? 20 : 0)) + "px" });
            
            if (this._scroll_axis) {
                this._content.obj.css({ height: (this.element.outerHeight() - (this._scroll_axis ? 20 : 0)) + "px" });
                this._viewport.obj.css('top', 20+"px");
            }
            else
                this._content.obj.css({ width: (this.element.outerWidth() - (this._scroll_axis ? 0 : 20)) + "px" });

            this._viewport[this.options.axis] = this._viewport.obj[0]['offset'+ this._scroll_size];
            this._content[this.options.axis] = this._content.obj[0]['scroll'+ this._scroll_size];
            this._content.ratio = this._viewport[this.options.axis] / this._content[this.options.axis];

            this._scrollbar.obj.toggleClass('disable', this._content.ratio >= 1);

            this._track[this.options.axis] = this.options.size === 'auto' 
                ? this._viewport[this.options.axis] 
                : this.options.size;

            this._thumb[this.options.axis] = Math.min(this._track[this.options.axis], 
                Math.max(0, 
                    (this.options.sizethumb === 'auto' 
                        ? (this._track[this.options.axis] * this._content.ratio) 
                        : this.options.sizethumb
                    )
                )
            );
        
            this._scrollbar.ratio = this.options.sizethumb === 'auto' 
                ? (this._content[this.options.axis] / this._track[this.options.axis]) 
                : (this._content[this.options.axis] - this._viewport[this.options.axis]) / (this._track[this.options.axis] - this._thumb[this.options.axis]);
            
            this._scroll_obj = (scroll === 'relative' && this._content.ratio <= 1) 
                ? Math.min((this._content[this.options.axis] - this._viewport[this.options.axis]), Math.max(0, this._scroll_obj)) 
                : 0;
            
            this._scroll_obj = (scroll === 'bottom' && this._content.ratio <= 1) 
                ? (this._content[this.options.axis] - this._viewport[this.options.axis]) 
                : isNaN( parseInt(scroll, 10)) ? this._scroll_obj : parseInt(scroll, 10);
            
            this.set_size();
        },

        set_size: function() {
            var css_size = this._scroll_size.toLowerCase();

            this._thumb.obj.css(this._scroll_direction, this._scroll_obj / this._scrollbar.ratio);
            this._content.obj.css(this._scroll_direction, -this._scroll_obj );
            this._mouse_obj.start = this._thumb.obj.offset()[this._scroll_direction];

            this._scrollbar.obj.css(css_size, this._track[this.options.axis]);
            this._track.obj.css(css_size, this._track[this.options.axis]);
            this._thumb.obj.css(css_size, this._thumb[this.options.axis]);

            this._is_visible = (this._content.obj.height() > this._viewport.obj.height());
        },

        _build_elements: function() {
            var viewport = $('<div />').addClass('viewport');
            var overview = $('<div />').addClass('overview');
            var scrollbar = $('<div />').addClass('scrollbar');
            var track = $('<div />').addClass('track').appendTo(scrollbar);
            var thumb = $('<div />').addClass('thumb').appendTo(track);
            var end = $('<div />').addClass('end').appendTo(thumb);            

            this.element
                .addClass('scroll-bar')
                .addClass(this.options.axis)
                .wrapInner(overview)
                .wrapInner(viewport);

            this.element.css('position', 'relative').prepend(scrollbar);

            this._viewport = { obj: $('.viewport', this.element) };
            this._content = { obj: $('.overview', this.element) };
            this._scrollbar = { obj: scrollbar };
            this._track = { obj: track };
            this._thumb = { obj: thumb };

            this._scrollbar.obj.hide();
        },

        _bind_events: function() { 
            if (!Modernizr.touch) {
                this._thumb.obj.bind('mousedown', $.proxy(this._start_bar, this));
                this._track.obj.bind('mouseup', $.proxy(this._drag_event, this));
            }
            else {
                this._viewport.obj[0].ontouchstart = function(event) {   
                    if (1 === event.touches.length) {
                        this._start_bar(event.touches[0]);
                        event.stopPropagation();
                    }
                };
            }

            if (this.options.scroll && window.addEventListener) {
                this.element.get(0).addEventListener('DOMMouseScroll', $.proxy(this._wheel_event, this), false);
                this.element.get(0).addEventListener('mousewheel', $.proxy(this._wheel_event, this), false);
            }
            else if (this.options.scroll) {
                this.element.get(0).onmousewheel = this._wheel_event;
            }

            this.element.hover(
                $.proxy(function(){ this._is_visible && this._scrollbar.obj.fadeIn('fast') }, this), 
                $.proxy(function(){ this._scrollbar.obj.fadeOut('fast') }, this)
            );
        },

        _start_bar: function(event) {
            $('body').addClass('scroll-bar-noselect');

            var _thumb_dir = parseInt(this._thumb.obj.css(this._scroll_direction), 10 );
            this._mouse_obj.start = this._scroll_axis ? event.pageX : event.pageY;
            this._position_obj.start = _thumb_dir == 'auto' ? 0 : _thumb_dir;
            
            if (!Modernizr.touch) {
                
                $(document).bind('mousemove', $.proxy(this._drag_event, this));
                $(document).bind('mouseup', $.proxy(this._stop_bar, this));
                this._thumb.obj.bind('mouseup', $.proxy(this._stop_bar, this));

            } else {
                document.ontouchmove = function(event) {
                    event.preventDefault();
                    drag(event.touches[0]);
                };
                document.ontouchend = this._stop_bar;        
            }
        },
        
        _stop_bar: function() {
            $('body').removeClass('scroll-bar-noselect');
            $(document).unbind('mousemove', this._drag_event);
            $(document).unbind('mouseup', this._stop_bar);
            this._thumb.obj.unbind('mouseup', this._stop_bar);
            document.ontouchmove = document.ontouchend = null;
        },

        _wheel_event: function(event) {
            if (this._content.ratio < 1) {
                var oEvent = event || window.event,
                iDelta = oEvent.wheelDelta ? oEvent.wheelDelta / 120 : -oEvent.detail / 3;

                this._scroll_obj -= iDelta * this.options.wheel;
                this._scroll_obj = Math.min(
                    (this._content[this.options.axis] - this._viewport[this.options.axis]), 
                    Math.max(0, this._scroll_obj)
                );

                this._thumb.obj.css(this._scroll_direction, this._scroll_obj / this._scrollbar.ratio);
                this._content.obj.css(this._scroll_direction, -this._scroll_obj);

                if (this.options.lockscroll 
                    || (this._scroll_obj !== (this._content[this.options.axis] - this._viewport[this.options.axis]) 
                    && this._scroll_obj !== 0) 
                ) {
                    oEvent = $.event.fix(oEvent);
                    oEvent.preventDefault();
                }
            }
        },

        _drag_event: function(event) {
            if (this._content.ratio < 1) {
                if (this.options.invertscroll && Modernizr.touch) {
                    this._position_obj.now = Math.min(
                        (this._track[this.options.axis] - this._thumb[this.options.axis]), 
                        Math.max(0, 
                            (this._position_obj.start 
                                + (this._mouse_obj.start 
                                - (this._scroll_axis ? event.pageX : event.pageY)))
                        )
                    );
                } else {
                     this._position_obj.now = Math.min(
                        (this._track[this.options.axis] - this._thumb[this.options.axis]), 
                        Math.max(0, 
                            (this._position_obj.start 
                                + ((this._scroll_axis ? event.pageX : event.pageY) 
                                - this._mouse_obj.start))
                        )
                    );
                }

                this._scroll_obj = this._position_obj.now * this._scrollbar.ratio;
                this._content.obj.css(this._scroll_direction, -this._scroll_obj);
                this._thumb.obj.css(this._scroll_direction, this._position_obj.now);
            }
        }

    });

})( jQuery, window, document );

