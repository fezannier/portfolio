var mouseOver = {}
var caption_height = '120px'

document.onload = loadProblems()

function showCaption(id)
{
	var selector = 'caption-' + id
	var caption = document.getElementById(selector)
	selector = '#thumbnail-' + id
	$(selector).fadeOut(150,0)
	selector = '#thumbnail-hover-' + id
	$(selector).fadeIn(150,0)
	caption.style.height = '80px'
	caption.style.display = 'block'
	var text = caption.children
	text[0].style.display = 'block'
	text[1].style.display = 'block'
}

function hideCaption(id)
{
	var selector = 'caption-' + id
	var caption = document.getElementById(selector)
	selector = '#thumbnail-' + id
	$(selector).fadeIn(150,0)
	selector = '#thumbnail-hover-' + id
	$(selector).fadeOut(150,0)
	caption.style.height = '0px'
	caption.style.display = 'none'
	var text = caption.children
	text[0].style.display = 'none'
	this.onmouseover = showCaption(id)
}

$(".project-container").on("mouseenter",function(){
	var id =$(this).attr('id')
	var selector = '#caption-' + id
	$(selector).animate({'height': caption_height}, 250, function(){$(this).css('border-bottom-style','none')})
	selector = 'caption-' + id
	caption = document.getElementById(selector)
	var text = caption.children
	text[0].style.display = 'block'
	text[1].style.display = 'block'
	selector = '#thumbnail-' + id
	$(selector).stop(true, false).fadeIn()
	$(selector).fadeOut(1500,0)
	var position = $(this).position()
}).on("mouseleave",function(){
	var id =$(this).attr('id')
	var selector = '#caption-' + id
	$(selector).animate({'height': '0px'}, 150, function(){$(this).css('border-bottom-style','none')})
	selector = 'caption-' + id
	caption = document.getElementById(selector)
	var text = caption.children
	text[0].style.display = 'none'
	text[1].style.display = 'none'
	selector = '#thumbnail-' + id
	$(selector).stop(true, false).fadeOut()
	$(selector).fadeIn(200,0)
})

$(".logo").on("mouseover",function(){
	$('html, body').stop(true, false).animate()	
	$('html, body').animate({ scrollTop: 0 }, {"duration" : 1000, "easing":'easeOutExpo'})
})

$(document).ready(function()
{
	resizeThumbs()
	setHeader()
})

$(window).resize(function() {
	resizeThumbs()
	setHeader()
})

function resizeThumbs()
{
	var ww = $(window).width()
	var  n = 4
	if(ww < 500)
		n = 1
	else if(ww > 500 && ww < 800)
		n = 2
	else if(ww > 800 && ww < 1200)
		n = 3
	if( n < 3)
	{
		$('.pitch').css('font-size','1.2em')
		$('.title').css('font-size','0.9em')
		$('.pitch, .title').css('line-height','15px')
		$('.title').css('margin-top','10px')
		$('#header-title').css('font-size','2em')
		$('#header').height('80px')
		$('#projects').css('margin-top','100px')
		caption_height = '80px'
		$('#email').css('display','none')
	}
	else
	{
		$('.pitch').css('font-size','1.17em')
		$('.title').css('font-size','1.5em')
		$('.pitch, .title').css('line-height','25px')
		$('.title').css('margin-top','30px')
		$('#header-title').css('font-size','2.5em')
		$('#header').height('108px')
		$('#projects').css('margin-top','120px')
		$('#projects').css('margin-left','30px')
		caption_height = '120px'
		$('#email').css('display','block')
	}
	var pcw = ((ww - (16 * (n-1)) - 60)/ n) 
	$('.project-container').width(pcw)
	$('.project-container').height(pcw)
}

function loadProblems()
{
	var xhr = new XMLHttpRequest()
	xhr.open('POST','/portfolio/problems',true)
	xhr.onload = function(event)
	{
		var mediaStr = String(event.target.responseText)
		var mediaJson = JSON.parse(mediaStr)
		var select = document.getElementById('problems')
		for(var m in mediaJson)
		{
			select.options[select.options.length] = new Option(mediaJson[m], m)
		}
	}
	xhr.send()
}

var projJson = {}

$(document).ready(function(){
	$("#problems").change(function() {
		var problem = $('#problems').val()
		if(problem == 'all')
		{
			var prj = $('.project-container')
			for(var i = 0; i < prj.length; i++)
			{
				$(prj[i]).fadeIn(400,0)
			}
		}
		else
		{
			var xhr = new XMLHttpRequest()
			var fd = new FormData(document.forms[0])
			fd.append("problem", problem)
			xhr.open('POST','/portfolio/filter',true)
			xhr.onload = function(event)
			{
				var prjStr = String(event.target.responseText)
				prjJson = JSON.parse(prjStr)
				var prj = $('.project-container')
				var prjFiltered = []
				for(var i in prjJson.projects)
					prjFiltered.push(prjJson.projects[i])
				for(var i = 0; i < prj.length; i++)
				{
					if(prjFiltered.indexOf($(prj[i]).attr('id')) == -1)
						$(prj[i]).fadeOut(400,0)
					else
						$(prj[i]).fadeIn(400,0)
				}
			}
			if(problem != "")
				xhr.send(fd)  		
		}
	})
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
		$('#projects').css('margin-top','200px')
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
		$('#projects').css('margin-top','100px')
		$('.navbar').css('padding-left','45px')
		$('.navbar').css('margin-left','0px')
		$('.navbar').css('margin-right','30px')
	}
}