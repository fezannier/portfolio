document.onload = init()
var photoFile, resumeFile
function init()
{	
	photoFile = document.getElementById('photo-file').innerHTML
	resumeFile = document.getElementById('resume-file').innerHTML
	loadInfo()
	var holder_gallery = document.getElementById('holder'),	
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
	  progress_gallery = document.getElementById('uploadprogress'),
	  fileupload_gallery = document.getElementById('upload')

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
				var photo = document.getElementById('photo')
				var li = document.createElement("li")
				li.setAttribute("class","span4")
				var a = document.createElement("a")
				a.setAttribute('class','thumbnail')
				a.setAttribute('href','#')
				var image = new Image()
				image.src = event.target.result
				image.width = 200
				a.appendChild(image)				
				var divForm = document.createElement("div")
				divForm.style.width = '260px'
				divForm.style.marginLeft = '-10px'
				divForm.innerHTML = '<button class="btn btn-danger" type="button" onclick="deletePhoto(\'' + filename + '\')"><i class="icon-trash icon-white"></i></button>'
				var thumbnail = document.createElement("div")
				var caption = document.createElement("div")
				thumbnail.setAttribute('class','thumbnail')
				caption.setAttribute('class','caption')
				caption.appendChild(divForm)
				thumbnail.appendChild(a)
				thumbnail.appendChild(caption)
				li.appendChild(thumbnail)
				li.setAttribute('id','photo_' + filename )
				photo.appendChild(li)
			}
			reader.readAsDataURL(file)
		}  
		else
		{
			holder.innerHTML += '<p>Uploaded ' + file.name + ' ' + (file.size ? (file.size/1024|0) + 'K' : '')
		}
	}
	
	function readfiles(files, type) {
		test = files
		var formData = tests.formdata ? new FormData() : null
		formData.append('file[]', files[0])
		previewfile(files[0], type)
		// now post a new XHR request
		if (tests.formdata) {
		  var xhr = new XMLHttpRequest()
		  xhr.open('POST', '/portfolio/upload')
		  formData.append('type', type)
		  formData.append('id','-1')
		  xhr.onload = function(event) 
		  {
			progress.value = progress_gallery.innerHTML = 100
		  }
		  if (tests.progress) 
		  {
			xhr.upload.onprogress = function (event) 
			{
			  if (event.lengthComputable) {
				var complete = (event.loaded / event.total * 100 | 0)
				progress.value = progress_gallery.innerHTML = complete
			  }
			}
		  }
		  xhr.send(formData)
		}
	}
	
	if (tests.dnd) 
	{ 
	  holder.ondragover = function () 
	  {
	  	this.className = 'hover'
	  	return false 
	  }
	  holder.ondragend = function () 
	  { 
	  	this.className = '' 
	  	return false 
	  }
	  holder.ondrop = function (e) 
	  {
		this.className = ''
		e.preventDefault()
		readfiles(e.dataTransfer.files, 'photo')
	  }
	} 
	else 
	{
	  fileupload.className = 'hidden'
	  fileupload.querySelector('input').onchange = function () 
	  {
		readfiles(this.files, 'photo')
	  }
	}
}

function loadInfo()
{
	if(photoFile != "None" && photoFile != "")
	{
		var photo = document.getElementById('photo')
		var li = document.createElement("li")
		li.setAttribute("class","span4")
		var a = document.createElement("a")
		a.setAttribute('class','thumbnail')
		a.setAttribute('href','#')
		a.innerHTML = '<img src="/portfolio/static/uploads/info/' + photoFile + '" width=200px/>'
		var divForm = document.createElement("div")
		divForm.style.width = '260px'
		divForm.style.marginLeft = '-10px'
		divForm.innerHTML = '<button class="btn btn-danger" type="button" onclick="deletePhoto(\'' + photoFile + '\')"><i class="icon-trash icon-white"></i></button>'
		var thumbnail = document.createElement("div")
		var caption = document.createElement("div")
		thumbnail.setAttribute('class','thumbnail')
		caption.setAttribute('class','caption')
		caption.appendChild(divForm)
		thumbnail.appendChild(a)
		thumbnail.appendChild(caption)
		li.appendChild(thumbnail)
		li.setAttribute('id','photo_' + photoFile )
		photo.appendChild(li)
	}
	if(resumeFile != "")
	{
		var resume = document.getElementById('resume')
		resume.innerHTML = 'Uploaded file: <i>' + resumeFile + '</i>'
	}
}

function logout()
{
	window.location = '/portfolio/logout'
}

function deletePhoto(filename)
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	fd.append("id", "-1")
	xhr.open('POST','/portfolio/delete',true)
	xhr.onload = function(event)
	{
		console.log(event)
		var selector = 'photo_' + filename
		document.getElementById(selector).remove()
	}
	xhr.send(fd)
}
