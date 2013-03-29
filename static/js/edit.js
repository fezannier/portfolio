var mediaJson = {}
var mediaStr = ""
var e = {}
var media = ""
document.onload = init() 
var id

function init()
{	
	id = document.getElementById('id').innerText
	loadMedia()
	loadProblems()
	var holder_gallery = document.getElementById('holder_gallery'),
	holder_thumb = document.getElementById('holder_thumb'),
	holder_thumb_hover = document.getElementById('holder_thumb_hover')	,
	tests = {
	  filereader: typeof FileReader != 'undefined',
	  dnd: 'draggable' in document.createElement('span'),
	  formdata: !!window.FormData,
	  progress: "upload" in new XMLHttpRequest
	},
	support = {
	  filereader: document.getElementById('filereader'),
	  formdata: document.getElementById('formdata'),
	  progress: document.getElementById('progress')
	},
	acceptedTypes = {
	  'image/png': true,
	  'image/jpeg': true,
	  'image/gif': true
	},
  	progress_gallery = document.getElementById('uploadprogress_gallery'),
	progress_thumb = document.getElementById('uploadprogress_thumb'),
	progress_thumb_hover = document.getElementById('uploadprogress_thumb_hover'),
	fileupload_gallery = document.getElementById('upload_gallery'),
	fileupload_thumb = document.getElementById('upload_thumb'),
	fileupload_thumb_hover = document.getElementById('upload_thumb_hover')

	"filereader formdata progress".split(' ').forEach(function (api) 
	{
		if (tests[api] === false) 
		{
			support[api].className = 'fail'
		}
		else
		{
			support[api].className = 'hidden'
		}
	})
	function previewfile(file, type) 
	{
		if (tests.filereader === true && acceptedTypes[file.type] === true) 
		{
			var reader = new FileReader()
			var filename = file.name
			reader.onload = function (event) 
			{
				var gallery = document.getElementById('gallery')
				var thumb = document.getElementById('thumb')
				var thumbHover = document.getElementById('thumbHover')
				var li = document.createElement("li")
				if(type == 'image')
					li.setAttribute("class","span4")
				else
					li.setAttribute("class","span3")
				//li.innerHTML = '<a href="#" class="thumbnail"></a>'
				var a = document.createElement("a")
				a.setAttribute('class','thumbnail')
				a.setAttribute('href','#')
				var image = new Image()
				image.src = event.target.result
				image.width = 200 // a fake resize
				a.appendChild(image)				
				var divForm = document.createElement("div")
				if(type == 'image')
				{
					divForm.setAttribute('class',"input-append")
					divForm.style.width = '260px'
					divForm.style.marginLeft = '-10px'
					divForm.innerHTML = '<input class="span3" id="comment_'+ filename +'" type="text"><button class="btn btn-info" type="button" onclick="caption(\'' + filename + '\',\'comment_' + filename +'\')"><i class="icon-comment icon-white"></i></button><button class="btn btn-danger" type="button" onclick="deleteImg(\'' + filename + '\',\'image\')"><i class="icon-trash icon-white"></i></button>'
				}
				else if( type == 'thumb')
					divForm.innerHTML = '</button><button class="btn btn-danger" type="button" onclick="deleteImg(\'' + filename + '\',\'thumb\')"><i class="icon-trash icon-white"></i></button>'
				else
					divForm.innerHTML = '</button><button class="btn btn-danger" type="button" onclick="deleteImg(\'' + filename + '\',\'thumb_hover\')"><i class="icon-trash icon-white"></i></button>'
				
				var thumbnail = document.createElement("div")
				var caption = document.createElement("div")
				thumbnail.setAttribute('class','thumbnail')
				caption.setAttribute('class','caption')
				caption.appendChild(divForm)
				thumbnail.appendChild(a)
				thumbnail.appendChild(caption)
				li.appendChild(thumbnail)
				li.setAttribute('id','thumb_' + filename )
				switch(type)
				{
					case('image'):
						gallery.appendChild(li)
						break
					case('thumb'):
						thumb.appendChild(li)
						break
					case('thumb_hover'):
						thumbHover.appendChild(li)
						break
				}
				
			}
			reader.readAsDataURL(file)
		}  
		else
		{
			switch(type)
			{
				case('image'):
					holder_gallery.innerHTML += '<p>Uploaded ' + file.name + ' ' + (file.size ? (file.size/1024|0) + 'K' : '')
					break
				case('thumb'):
					holder_thumb.innerHTML += '<p>Uploaded ' + file.name + ' ' + (file.size ? (file.size/1024|0) + 'K' : '')
					break
				case('thumb_hover'):
					holder_thumb_hover.innerHTML += '<p>Uploaded ' + file.name + ' ' + (file.size ? (file.size/1024|0) + 'K' : '')
					break
			}
			console.log(file)
		}
}

	function readfiles(files, type) {
		test = files
		var formData = tests.formdata ? new FormData() : null
		if(type == 'image')
		{
			for (var i = 0; i < files.length; i++) 
			{
				if (tests.formdata) 
				{		
				  formData.append('file[]', files[i])
				}
				previewfile(files[i], type)
			  }
		}
		else
		{
			formData.append('file[]', files[0])
			previewfile(files[0], type)
		}
		// now post a new XHR request
		if (tests.formdata) {
		  var xhr = new XMLHttpRequest()
		  xhr.open('POST', '/portfolio/upload')
		  formData.append(	'type', type)
		  var id = document.getElementById('id').innerHTML
		   formData.append(	'id', id)
		  xhr.onload = function(event) {
		  	switch(type)
		  	{
		  		case('image'):
					progress_gallery.value = progress_gallery.innerHTML = 100
					break
				case('thumb'):
					progress_thumb.value = progress_thumb.innerHTML = 100
					break
				case('thumb_hover'):
					progress_thumb_hover.value = progress_thumb_hover.innerHTML = 100
					break
			}
		  }
	
		  if (tests.progress) 
		  {
			xhr.upload.onprogress = function (event) 
			{
			  if (event.lengthComputable) {
				var complete = (event.loaded / event.total * 100 | 0)
				switch(type)
				{
					case('image'):
						progress_gallery.value = progress_gallery.innerHTML = complete
						break
					case('thumb'):
						progress_thumb.value = progress_thumb.innerHTML = complete
						break
					case('thumb_hover'):
						progress_thumb_hover.value = progress_thumb_hover.innerHTML = complete
						break
				}
			  }
			}
		  }
		  xhr.send(formData)
		}
	}
	
	if (tests.dnd) { 
	  holder_gallery.ondragover = function () { this.className = 'hover'
	  return false }
	  holder_gallery.ondragend = function () { this.className = '' 
	  return false }
	  holder_gallery.ondrop = function (e) {
		this.className = ''
		e.preventDefault()
		readfiles(e.dataTransfer.files, 'image')
	  }
	  holder_thumb.ondragover = function () { this.className = 'hover'
	  return false }
	  holder_thumb.ondragend = function () { this.className = '' 
	  return false }
	  holder_thumb.ondrop = function (e) {
		this.className = ''
		e.preventDefault()
		readfiles(e.dataTransfer.files, 'thumb')
	  }
	  holder_thumb_hover.ondragover = function () { this.className = 'hover'
	  return false }
	  holder_thumb_hover.ondragend = function () { this.className = '' 
	  return false }
	  holder_thumb_hover.ondrop = function (e) {
		this.className = ''
		e.preventDefault()
		readfiles(e.dataTransfer.files, 'thumb_hover')
	  }
	} else {
	  fileupload_gallery.className = 'hidden'
	  fileupload_gallery.querySelector('input').onchange = function () {
		readfiles(this.files, 'image')
	  }
	  fileupload_thumb.className = 'hidden'
	  fileupload_thumb.querySelector('input').onchange = function () {
		readfiles(this.files, 'thumb')
	  }
	  fileupload_thumb_hover.className = 'hidden'
	  fileupload_thumb_hover.querySelector('input').onchange = function () {
		readfiles(this.files, 'thumb_hover')
	  }
	}
}

function deleteImg(filename, type)
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	id = document.getElementById('id').innerHTML
	fd.append("id", id)
	fd.append("filename", filename)
	fd.append("type", type)
	xhr.open('POST','/portfolio/deleteImg',true)
	xhr.onload = function(event)
	{
		console.log(event)
		var selector = 'thumb_' + filename
		document.getElementById(selector).remove()
	}
	xhr.send(fd)
}

function caption(filename, input)
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	id = document.getElementById('id').innerHTML
	fd.append("id", id)
	fd.append("filename", filename)
	var caption = document.getElementById(input).value
	fd.append("caption", caption)
	xhr.open('POST','/portfolio/caption',true)
	xhr.onload = function(event)
	{
		console.log(event)
	}
	xhr.send(fd)
}

function cancelForm()
{
	window.location = '/portfolio/admin'
}

function logout()
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	id = document.getElementById('id').innerHTML
	fd.append("id", id)
	xhr.open('POST','/delete',true)
	xhr.onload = function(event)
	{
		console.log(event)
		window.location = '/logout'
	}
	xhr.send(fd)
}

var optionsToSelect = []
var s = ""

function loadMedia()
{
	var xhr = new XMLHttpRequest()
	xhr.open('POST','/portfolio/media',true)
	xhr.onload = function(event)
	{
		var mediaStr = String(event.target.responseText)
		var mediaJson = JSON.parse(mediaStr)
		var select = document.getElementById('media')
		for(var m in mediaJson)
		{
			var index = select.options.length
			select.options[index] = new Option(mediaJson[m], m)
		}
		loadProject()
	}
	xhr.send()
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

function addMedium()
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	var medium = document.getElementById('medium').value
	fd.append("medium", medium)
	xhr.open('POST','/portfolio/medium',true)
	xhr.onload = function(event)
	{
		var mediaStr = String(event.target.responseText)
		var mediaJson = JSON.parse(mediaStr)
		var select = document.getElementById('media')
		for(var m in mediaJson)
		{
			var index = select.options.length
			select.options[index] = new Option(mediaJson[m], m)
			select.options[index].setAttribute("selected", "selected")
		}
		document.getElementById('medium').value = ''
	}
	if(medium != "")
	{
		xhr.send(fd)
	}
}

function addProblem()
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	var problem = document.getElementById('problem').value
	fd.append("problem", problem)
	fd.append("id", id)
	xhr.open('POST','/portfolio/problem',true)
	xhr.onload = function(event)
	{
		console.log(event.target.responseText)
		var mediaStr = String(event.target.responseText)
		var mediaJson = JSON.parse(mediaStr)
		var select = document.getElementById('problems')
		for(var m in mediaJson)
		{
			var index = select.options.length
			select.options[index] = new Option(mediaJson[m], m)
			select.options[index].setAttribute("selected", "selected")
		}
		document.getElementById('problem').value = ''
	}
	console.log(problem)
	if(problem != "")
	{
		xhr.send(fd)
	}
}



function loadProject()
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	var id = document.getElementById('id').value
	fd.append("id", id)
	xhr.open('POST','/portfolio/loadProject',true)
	xhr.onload = function(event)
	{
		mediaStr = String(event.target.responseText)
		console.log(mediaStr)
		mediaJson = JSON.parse(mediaStr)
		for(var i in mediaJson.images)
		{
			console.log(i)
			var caption = mediaJson.images[i] == 'None' ? '' : mediaJson.images[i]
			loadImage(i,'image',caption)
		}
		if(mediaJson.thumbnail)
		{
			loadImage(mediaJson.thumbnail, 'thumb','')
		}
		if(mediaJson.thumbnailHover)
		{
			loadImage(mediaJson.thumbnailHover, 'thumb_hover','')
		}
		if(mediaJson.archive == "archive")
		{
			$('#archive').prop('checked', true)
		}
		var media = mediaJson.media=="" ? null : mediaJson.media
		if( media )
		{
			var options = media.split(',')
			var select = document.getElementById('media')
			for(var i in select.options)
			{
				for(var j in options)
				{
					var opt = options[j].replace(',')
					opt = opt.trim()
					if(select.options[i].value == options[j])
					{	
						select.options[i].setAttribute("selected", "selected")
						break
					}
				}
			}
		}
		var problems = mediaJson.problems=="" ? null : mediaJson.problems
		if( problems )
		{
			var options = problems.split(',')
			var select = document.getElementById('problems')
			for(var i in select.options)
			{
				for(var j in options)
				{
					var opt = options[j].replace(',')
					opt = opt.trim()
					if(select.options[i].value == options[j])
					{	
						select.options[i].setAttribute("selected", "selected")
						break
					}
				}
			}
		}
		if(mediaJson.year)
		{
			var select = document.getElementById('year')
			for(var i in select.options)
			{
				if(select.options[i].value == String(mediaJson.year))
				{	
					select.options[i].setAttribute("selected", "selected")						
					select.value = String(mediaJson.year)
					break
				}
			}
		}
	}
	xhr.send(fd)
}

function loadImage(filename, type, caption) 
{
	var gallery = document.getElementById('gallery')
	var thumb = document.getElementById('thumb')
	var thumbHover = document.getElementById('thumbHover')
	var li = document.createElement("li")
	if(type == 'image')
		li.setAttribute("class","span4")
	else
		li.setAttribute("class","span3")
	var a = document.createElement("a")
	a.setAttribute('class','thumbnail')
	a.setAttribute('href','#')
	a.innerHTML = '<img src="/portfolio/static/uploads/' + id + '/' + filename + '" width=200px/>'
	var divForm = document.createElement("div")
	if(type == 'image')
	{
		divForm.setAttribute('class',"input-append")
		divForm.style.width = '260px'
		divForm.style.marginLeft = '-10px'
		divForm.innerHTML = '<input class="span3" id="comment_'+ filename +'" type="text" + value="' + caption + '"><button class="btn btn-info" type="button" onclick="caption(\'' + filename + '\',\'comment_' + filename +'\')"><i class="icon-comment icon-white"></i></button><button class="btn btn-danger" type="button" onclick="deleteImg(\'' + filename + '\',\'image\')"><i class="icon-trash icon-white"></i></button>'
	}
	else if( type == 'thumb')
		divForm.innerHTML = '</button><button class="btn btn-danger" type="button" onclick="deleteImg(\'' + filename + '\',\'thumb\')"><i class="icon-trash icon-white"></i></button>'
	else
		divForm.innerHTML = '</button><button class="btn btn-danger" type="button" onclick="deleteImg(\'' + filename + '\',\'thumb_hover\')"><i class="icon-trash icon-white"></i></button>'
	
	var thumbnail = document.createElement("div")
	var caption = document.createElement("div")
	thumbnail.setAttribute('class','thumbnail')
	caption.setAttribute('class','caption')
	caption.appendChild(divForm)
	thumbnail.appendChild(a)
	thumbnail.appendChild(caption)
	li.appendChild(thumbnail)
	li.setAttribute('id','thumb_' + filename )
	switch(type)
	{
		case('image'):
			gallery.appendChild(li)
			break
		case('thumb'):
			thumb.appendChild(li)
			break
		case('thumb_hover'):
			thumbHover.appendChild(li)
			break
	}
}