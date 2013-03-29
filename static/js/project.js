document.load = init()
var imgWidths = []
var currImgIndex = 0, counter = 0
var images = {}

function init()
{
	setHeader()
	setGallery()
	var params =  getUrlVars()
	if(params['from'] == 'portfolio')
	{
		$('#archive').css('color','grey')
		$('#goback').attr('href','/portfolio')
	}
	else
	{
		$('#work').css('color','grey')
		$('#archive').css('color','black')
		$('#goback').attr('href','/portfolio/archive')
	}
}

$("img").load(function() {
  	images = $('img')
    counter = images.length
    images.each(function() 
    {
        if( this.complete ) {
            imageLoaded.call( this )
        } else {
            $(this).one('load', imageLoaded)
        }
    })
})

function imageLoaded() 
{
	counter--
	if( counter === 0 ) {
		var w = getTotalWidth() + 1 //plus one for IE
		$('#project-gallery').width(w)
		//$('#project-gallery-container').animate({ scrollLeft: getScrollValue(currImgIndex) }, {"duration" : 450, "easing":"easeOut"})
		$('#project-gallery').animate({ left: -getScrollValue(currImgIndex) }, {"duration" : 200, "easing":"easeOutQuad", "complete": function(){setControlWidth(currImgIndex)}})
		setControlWidth(currImgIndex)
		setOpacityImg(currImgIndex,1)
	}
}

function getTotalWidth()
{
	var gallery = document.getElementById('project-gallery')
	var imgs = gallery.getElementsByTagName('img')
	var w = 0
	for ( var i = 0; i < imgs.length; i++ )
	{
		imgWidths[i] = imgs[i].offsetWidth
    	w += parseInt(imgs[i].offsetWidth)
	}	
	return w
}

$("#project-gallery-control").on("mouseenter",function(){
	$('html, body').stop(true, false).animate()
	var marginTop =	$('#project-description').height() + 85
	$('html, body').animate({ scrollTop: marginTop }, {"duration" : 600, "easing":'easeInSine'})
})

$("#next").mouseover(function(){
	$(this).animate({opacity: 1},{"duration" : 200, "easing":"easeOutQuad"})
})

$("#next").click(function(){
	$('#project-gallery-container').stop(true, false).animate()
	if( currImgIndex < (imgWidths.length-1) )
	{
		currImgIndex++
		$(this).animate({opacity: 1},{"duration" : 600, "easing":"easeOutQuad"})
	}
	$('#project-gallery').animate({ left: -getScrollValue(currImgIndex) }, {"duration" : 200, "easing":"easeOutQuad", "complete": function(){setControlWidth(currImgIndex)}})
	setOpacityImg(currImgIndex,1)
	if( currImgIndex != 0 )
		setOpacityImg(currImgIndex - 1 ,0.2)
})

$("#prev").mouseover(function(){
	$(this).animate({opacity: 1},{"duration" : 200, "easing":"easeOutQuad"})
})

$("#prev").click(function(){
	$('#project-gallery-container').stop(true, false).animate()
	if( currImgIndex > 0)
	{
		currImgIndex--
		$(this).animate({opacity: 1},{"duration" : 600, "easing":"easeOutQuad"})
	}
	$('#project-gallery').animate({ left: -getScrollValue(currImgIndex) }, {"duration" : 200, "easing":"easeOutQuad", "complete": function(){setControlWidth(currImgIndex)}})
	setOpacityImg(currImgIndex,1)
	if( currImgIndex != (imgWidths.length - 1) )
		setOpacityImg(currImgIndex + 1 ,0.2)
})

$("#next").mouseout(function(){
	$('#project-gallery-container').stop(true, false).animate()
	$(this).animate({opacity: 0.2},{"duration" : 500, "easing":"easeIn"})
})

$("#prev").mouseout(function(){
	$('#project-gallery-container').stop(true, false).animate()
	$(this).animate({opacity: 0.2},{"duration" : 500, "easing":"easeIn"})
})

function setOpacityImg(_index,_opacity)
{
	 var image = $('img')[_index]
	 $(image).css('opacity', _opacity)
}

function setControlWidth(_imgIndex)
{
	var offsetCurrImg = 0
	if( _imgIndex == 0 )
	{
		offsetCurrImg = (($(window).width() - imgWidths[_imgIndex]))
		offsetCurrImg = offsetCurrImg <= 0 ? 70 : offsetCurrImg
		if (navigator.appName == 'Microsoft Internet Explorer')
  		{
  			offsetCurrImg = $(window).width()
	  	}
		$('#next').css('width',offsetCurrImg)
		$('#prev').css('width',0)
		$('#prev').animate({opacity: 0},{"duration" : 500, "easing":"easeIn"})
	}
	else if(_imgIndex == (imgWidths.length-1) )
	{
		offsetCurrImg = (($(window).width() - imgWidths[_imgIndex]))
		offsetCurrImg = offsetCurrImg <= 0 ? 70 : offsetCurrImg
		if (navigator.appName == 'Microsoft Internet Explorer')
  		{
  			offsetCurrImg = $(window).width()
	  	}
		$('#next').css('width',0)
		$('#prev').css('width',offsetCurrImg)
		$('#next').animate({opacity: 0},{"duration" : 500, "easing":"easeIn"})
	}
	else
	{
		offsetCurrImg = (($(window).width() - imgWidths[_imgIndex]) / 2)
		offsetCurrImg = offsetCurrImg <= 0 ? 70 : offsetCurrImg
		if (navigator.appName == 'Microsoft Internet Explorer')
  		{
  			offsetCurrImg = $(window).width() / 2
	  	}
		$('#next').css('width',offsetCurrImg)
		$('#prev').css('width',offsetCurrImg)
	}
}

function getScrollValue(_imgIndex)
{
	if(_imgIndex == 0)
		return	0
	if(_imgIndex == (imgWidths.length - 1) )
		return	(getLeftScrollToImage(_imgIndex - 1) + (imgWidths[_imgIndex - 1] - ($(window).width() - imgWidths[_imgIndex] )) )
	var offsetCurrImg = imgWidths[_imgIndex - 1 ] - (($(window).width() - imgWidths[_imgIndex]) / 2)
	var totalScrollPrevImgs = getLeftScrollToImage(_imgIndex -1 )
	return ( totalScrollPrevImgs + offsetCurrImg )
}

function getLeftScrollToImage(_index)
{
	var w = 0
	for(var i = 0; i < _index; i++)
		w += imgWidths[i]
	return w
}

$("#header").on("mouseenter",function(){
	$('html, body').stop(true, false).animate()	
	$('html, body').animate({ scrollTop: 0 }, {"duration" : 600, "easing":'easeInSine'})
})

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

function getUrlVars() 
{
	var vars = {}
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value
	})
	return vars
}

$(window).resize(function() {
	setHeader()
	setGallery()
})

function setGallery()
{
	var marginTop = $('#project-description').height() + $('#header').height() - 60
	$('#project-gallery-control').css('top',marginTop)
	$('#project-gallery-container').css('top',marginTop)
	marginTop = marginTop + $('#project-gallery-container').width()
	$('#filler').css('top',marginTop)
}

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
		$('#project-text').css('margin-top','200px')
	}
	if($(window).width() < 650)
	{
		var widthDescription = $(window).width() - 60
		$('#project-description').css('width',widthDescription)
		$('#project-description').css('margin-top','20px')
	}
	if($(window).width() < 460)
	{
		$('#header-title').css('font-size','2em')
	}
	if($(window).width() > 460)
	{
		$('#header-title').css('font-size','2.5em')
	}	
	if($(window).width() > 650)
	{
		$('#project-description').css('margin-top','0px')
	}
	if($(window).width() > 960)
	{
		$('#header').css('height','100px')
		$('.navbar').css('margin-top','33px')
		$('#navbar-container').css('float','right')
		$('#project-text').css('margin-top','140px')
		$('.navbar').css('padding-left','45px')
		$('.navbar').css('margin-left','0px')
		$('.navbar').css('margin-right','30px')
	}
}