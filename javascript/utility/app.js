;(function ($, window, undefined) {
    'use strict';

    var $doc = $(document),
      Modernizr = window.Modernizr;

    $(document).ready(function() { 
        $.utility.statusbar && $doc.statusbar();
        $.utility.forms && $doc.forms();

        // Tweak to foundation's topbar.js
        $('.top-bar ul.dropdown a.link').click(function() { 
            var dropdown = $(this).closest('.dropdown').hide(); setTimeout(function(){ dropdown.show(); }, 500); 
            $('.top-bar .toggle-topbar > a').trigger('click');
        });

    });

})(jQuery, this);