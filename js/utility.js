;(function ($, window, undefined) {
	'use strict';

	var $doc = $(document),
	Modernizr = window.Modernizr;

	$(document).ready(function() { 
		if (!$.utility)
			return;
		
		$.utility.statusbar && $doc.statusbar();
	});

})(jQuery, this);