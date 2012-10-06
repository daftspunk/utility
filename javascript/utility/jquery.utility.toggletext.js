
// Toggle text between current and data-toggle-text contents
$.fn.extend({
    toggleText: function() {
        var self = $(this);
        var text = self.text();
        var ttext = self.data('toggle-text');
        var tclass = self.data('toggle-class');
        self.text(ttext).data('toggle-text', text).toggleClass(tclass);
    }
});

