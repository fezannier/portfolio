$(document).ready(function()
{
	setHeader()
})

$(window).resize(function() {
	setHeader()
})

function setHeader()
{
	if($(window).width() < 960)
	{
		$('#header').css('height','200px')
		$('.navbar').css('margin-top','0px')
		$('.navbar').css('padding-left','0')
		$('.navbar').css('margin-left','30px')
		$('.navbar').css('margin-right','0px')
		$('#navbar-container').css('float','none')
		$('#bio').css('margin-top','190px')
	}
	if($(window).width() < 760)
	{
		var w = $(window).width() - 60
		$('.content').css('width',w)
	}
	if($(window).width() < 460)
	{
		$('#header-title').css('font-size','2em')
	}
	if($(window).width() > 460)
	{
		$('#header-title').css('font-size','2.5em')
	}	
	if($(window).width() > 960)
	{
		$('#header').css('height','100px')
		$('.navbar').css('margin-top','33px')
		$('#navbar-container').css('float','right')
		$('#bio').css('margin-top','0px')
		$('.navbar').css('padding-left','45px')
		$('.navbar').css('margin-left','0px')
		$('.navbar').css('margin-right','30px')
	}
}