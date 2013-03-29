//Firefox
$('body').bind('DOMMouseScroll', function(e) {
	$('.project-container').stop(true, false).animate()
	$('html, body').stop(true, false).animate()
})

//IE, Opera, Webkit
$('body').bind('mousewheel', function(e){
	$('.project-container').stop(true, false).animate()
	$('html, body').stop(true, false).animate()
})

$("#address, #phone, #email").on("mouseover",function(){
	$('html, body').stop(true, false).animate()	
	var position = $(this).position()
	$('html, body').animate({ scrollTop: position.top}, {"duration" : 800, "easing":'easeOutExpo'})
})