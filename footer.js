$(document).ready(function() {
	
	// INITIATE THE FOOTER
  siteFooter();
		$(window).resize(function() {
		siteFooter();
	});
	
	function siteFooter() {
		var siteContent = $('#site-content');
		var siteContentHeight = siteContent.height();
		var siteContentWidth = siteContent.width();

		var siteFooter = $('#site-footer');
		var siteFooterHeight = siteFooter.height();
		var siteFooterWidth = siteFooter.width();

		console.log('Content Height = ' + siteContentHeight/2 + 'px');
		console.log('Content Width = ' + siteContentWidth/2 + 'px');
		console.log('Footer Height = ' + siteFooterHeight/2 + 'px');
		console.log('Footer Width = ' + siteFooterWidth/2 + 'px');

		siteContent.css({
			"margin-bottom" : siteFooterHeight  +20
		});
	};
});