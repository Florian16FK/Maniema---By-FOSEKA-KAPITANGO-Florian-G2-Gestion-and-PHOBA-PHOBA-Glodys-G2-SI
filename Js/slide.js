function imageGalerie()
	{
	var active = $('#corps .active');
	
	var next = (active.next().length > 0) ? active.next() : $('#corps img:first');
	
	active.fadeOut(function()
	{
		active.removeClass('active');
		next.fadeIn().addClass('active');
		
	});
}
setInterval('imageGalerie()',2500);