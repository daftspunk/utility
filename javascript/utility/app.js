;(function ($, window, undefined) {
    'use strict';

    var $doc = $(document),
      Modernizr = window.Modernizr;

    $(document).ready(function() { 
        $.utility.bar && $doc.bar();

        // Tweak to foundation's topbar.js
        $('.top-bar ul.dropdown a.link').click(function() { var dropdown = $(this).closest('.dropdown').hide(); setTimeout(function(){ dropdown.show(); }, 500); });

    });

})(jQuery, this);