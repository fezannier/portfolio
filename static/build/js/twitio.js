var TWITIO = TWITIO ||  { REVISION: '01' }

TWITIO.width 	= 1280
TWITIO.height 	= 720
TWITIO.FPS 		= 10

TWITIO.Composition = function () {
	this.container		 = null
	this.camera     	 = null
	this.scene           = null
	this.renderer	     = null
	this.projector  	 = null
	this.lightFront      = null
	this.lightBottom     = null
	this.callbacks       = null
	this.mousePressed    = false
	this.id				 = null
	this.pieces			 = new Array()
}

TWITIO.Composition.prototype = {
	constructor: TWITIO.Composition,
	screenshot: function( _filename, _download ) {
		var dataUrl = this.renderer.domElement.toDataURL( "image/png" )
		var blob = dataURItoBlob( dataUrl )
		var URL = window.URL || window.webkitURL || window.mozURL || window.msURL
		url = URL.createObjectURL( blob )
		var link = document.createElement( "a" )
		link.setAttribute( "href", url )
		if(_filename.indexOf( '.png' ) == -1 && _filename.length != 0)
			_filename = _filename + '.png'
		if ( _download == true )
		{
			link.setAttribute( "download", _filename || "screenshot.png" )
			var event = document.createEvent( 'MouseEvents' )
			event.initMouseEvent( 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null )
			link.dispatchEvent( event )
		}
		return dataUrl
	},
	getSize: function() {
		var size = {}
		size['width'] = TWITIO.width
		size['height'] = TWITIO.height
		return size
	},
	init: function( _container ) {
		this.container = document.getElementById( _container );
		var ratio   = TWITIO.width / TWITIO.height
		this.scene = new THREE.Scene();
		this.camera = new THREE.OrthographicCamera( 
			TWITIO.width / - 2, 
			TWITIO.width / 2, 
			TWITIO.height / 2, 
			TWITIO.height / - 2, 
			-1000, 
			1000)
		this.renderer    = new THREE.WebGLRenderer( {antialias: true, preserveDrawingBuffer: true} )
		this.renderer.setSize(TWITIO.width, TWITIO.height)
		this.scene.add( this.camera )
		//document.body.appendChild( this.renderer.domElement )
		this.container.appendChild( this.renderer.domElement )
		this.lightFront = new THREE.PointLight(0xFFFFFF, 1.5)
		this.lightFront.position.y = 400
		this.scene.add( this.lightFront)
		this.lightBottom = new THREE.DirectionalLight(0xFFFFFF, 1.3)
		this.lightBottom.position.y = -240
		this.scene.add( this.lightBottom )
	},
	createPiece: function ( _url, _filename, _x, _y, _scale, _rotX, _rotY, _rotZ ) {
		var loader = new THREE.JSONLoader()
		var piece = new TWITIO.Piece()
		var composition = this
		var xhr_delete = new XMLHttpRequest()
		var fd_delete = new FormData(document.forms[0])
		function onLoadGeometry( _geometry ) 
		{
			piece.make( _geometry )
			piece.setX( _x )
			piece.setX( _y )
			piece.setScale( _scale )
			piece.setRotX( _rotX )
			piece.setRotY( _rotY )
			piece.setRotZ( _rotZ )
			piece.setFilename( _filename )
			composition.scene.add( piece.object )
			composition.pieces.push( piece )
			fd_delete.append("filename", _filename)
			xhr_delete.open('POST', '/delete', true)
			xhr_delete.send(fd_delete)
		}
		loader.load( _url, onLoadGeometry)
	},
	animate: function ( _mode, _composition ) {
		if( _mode != 'edit' )
		{
			for(var i; i < _composition.pieces.length ; i++)
			{
				_composition.pieces[i].createSprings()
				//this.pieces[i].displaceRandomFace()
				_composition.updateVertexSprings()
			}
			
		}
		/*_composition.pieces[0].object.geometry.__dirtyVertices = true
		_composition.pieces[0].object.geometry.__dirtyNormals = true
		_composition.pieces[0].object.geometry.computeFaceNormals()
		_composition.pieces[0].object.geometry.computeVertexNormals()*/
		_composition.renderer.render( _composition.scene, _composition.camera )
		_composition.id = setTimeout( _composition.animate, TWITIO.FPS / 1000, "normal", _composition )
	},
	stop: function () {
		window.clearTimeout( this.id )
	}
}

TWITIO.Piece = function () {
	this.meshMaterial      = null
	this.object	  		   = null
	this.scale  		   = 1
	this.x  			   = 0
	this.y  	  		   = 0
	this.rotX	  		   = 0
	this.rotY	  		   = 0
	this.rotZ	  		   = 0
	this.filename 		   = null
	this.DISPLACEMENT      = 0.2
	this.SPRING_STRENGTH   = 0.0009
	this.DAMPEN            = 0.97
	this.DEPTH             = 600
}

TWITIO.Piece.prototype = {
	constructor: TWITIO.Piece,
	setX: function( _value ) {
		this.x += _value
		this.object.position.x = this.x
	},
	setY: function( _value ) {
		this.y += _value
		this.object.position.y = this.y
	},
	setRotX: function( _value ) {
		this.rotX = _value
		this.object.rotation.x = this.rotX
	},
	setRotY: function( _value ) {
		this.y_rot = _value
	},
	setRotZ: function( _value ) {
		this.z_rot = _value
	},
	setFilename: function( _value ) {
		this.filename = _value
	},
	setScale: function(value) {
		this.scale = value
	},
	setDisplacement: function ( _value ) {
		this.DISPLACEMENT = _value
	},
	setSpringStrenght: function ( _value ) {
		this.SPRING_STRENGTH = _value
	},
	setDampen: function ( _value) {
		this.DAMPEN = _value
	},
	make: function( _geometry ) {
		var urls = [
			'/static/img/mirror.jpg',
			'/static/img/mirror.jpg',
			'/static/img/mirror.jpg',
			'/static/img/mirror.jpg',
			'/static/img/mirror.jpg',
			'/static/img/mirror.jpg'
		]
		var textures = THREE.ImageUtils.loadTextureCube(urls)
		this.geometry = _geometry
		this.meshMaterial = new THREE.MeshLambertMaterial({
			color     : 0xefefef,
			shininess : 50,
			envMap    : textures,
			shading   : THREE.SmoothShading})
		this.object = new THREE.Mesh( this.geometry, this.meshMaterial )
		this.object.geometry.dynamic = true
	},
	makeSprings: function () {
		var objectFaces = this.object.geometry.faces
		for(var f = 0; f < objectFaces.length; f++) 
		{
			var face = objectFaces[f]
			// these may be Face3s, i.e. composed of
			// three vertices, or Face4s, so we need
			// to double check and not use face.d if
			// it doesn't exist.
			if(face instanceof THREE.Face3) 
			{
				this.createSpring(face.a, face.b)
				this.createSpring(face.b, face.c)
				this.createSpring(face.c, face.a)
			} 
			else 
			{
				this.createSpring(face.a, face.b)
				this.createSpring(face.b, face.c)
				this.createSpring(face.c, face.d)
				this.createSpring(face.d, face.a)
			}
		}
	},
	createSpring: function ( start, end ) {
		var objectVertices = this.object.geometry.vertices
		var startVertex    = objectVertices[start]
		var endVertex      = objectVertices[end]
		// if the springs array does not
		// exist for a particular vertex
		// create it
		if(!startVertex.springs) 
		{
			startVertex.springs = []
			// take advantage of the one-time init
			// and create some other useful vars
			startVertex.normal = startVertex.position.clone().normalize()
			startVertex.originalPosition = startVertex.position.clone()
		}
		// repeat the above for the end vertex
		if(!endVertex.springs) 
		{
			endVertex.springs = []
			endVertex.normal = startVertex.position.clone().normalize()
			endVertex.originalPosition = endVertex.position.clone()
		}
		if(!startVertex.velocity) 
		{
			startVertex.velocity = new THREE.Vector3()
		}
		// finally create a spring
		startVertex.springs.push({
			start   : startVertex,
			end     : endVertex,
			length  : startVertex.position.length( endVertex.position )
		})
	},
	displaceFace: function ( _face, _magnitude ) {
		// displace the first three vertices
		this.displaceVertex( _face.a, _magnitude)
		this.displaceVertex( _face.b, _magnitude)
		this.displaceVertex( _face.c, _magnitude)
		// if this is a face4 do the final one
		if( _face instanceof THREE.Face4) 
		{
			this.displaceVertex( _face.d, _magnitude)
		}
	},
	displaceVertex: function ( _vertex, _magnitude ) {
		var objectVertices = this.object.geometry.vertices
		objectVertices[ _vertex ].velocity.addSelf(objectVertices[ _vertex ].normal.clone().multiplyScalar( _magnitude ))
	},
	updateVertexSprings: function () {
		var objectVertices = this.object.geometry.vertices,
		vertexCount    = objectVertices.length,
		vertexSprings  = null,
		vertexSpring   = null,
		extension      = 0,
		length         = 0,
		force          = 0,
		vertex         = null,
		acceleration   = new THREE.Vector3(0, 0, 0)
		while(vertexCount--) 
		{
			vertex = objectVertices[vertexCount]
			vertexSprings = vertex.springs
			if(!vertexSprings) 
			{
				continue
			}
			for(var v = 0; v < vertexSprings.length; v++) 
			{
				vertexSpring = vertexSprings[v]
				length = vertexSpring.start.position.
				length(vertexSpring.end.position)
				extension = vertexSpring.length - length
				acceleration.copy(vertexSpring.start.normal).multiplyScalar( extension * this.SPRING_STRENGTH )
				vertexSpring.start.velocity.addSelf(acceleration)
				acceleration.copy(vertexSpring.end.normal).multiplyScalar( extension * this.SPRING_STRENGTH )
				vertexSpring.end.velocity.addSelf( acceleration )
				vertexSpring.start.position.addSelf( vertexSpring.start.velocity) 
				vertexSpring.end.position.addSelf( vertexSpring.end.velocity )
				vertexSpring.start.velocity.multiplyScalar( this.DAMPEN )
				vertexSpring.end.velocity.multiplyScalar( this.DAMPEN )
			}
			vertex.position.addSelf(vertex.originalPosition.clone().subSelf(vertex.position).multiplyScalar(0.03))
		}
	}
}//buttons appeareance
var mode = 'none', template = '1'
//uploading
var holder, tests = {}, support = {}, acceptedTypes = {}, fileupload
var filename
//make movie
var intervalMakeMovieID, movieID, frameCounter, recording = new Boolean(), FRAMES_PER_MINUTE = 12
//object counter
var objCounter = 0 

/*************************
/ CONTROL and SETUP functions
/*************************
/*
* hide the loading gif
* test if the browser support progressive upload, draggable items, file reader and from data
* set mode to 'edit' andset button appeareance accordingly
*/
function initialize()
{	
	$('#icon-loading').css('visibility','hidden')
	holder = document.getElementById('holder')
	tests = { //try to create the element in the DOM to check if supported
		filereader: typeof FileReader != 'undefined', //browser has a filereader
		dnd: 'draggable' in document.createElement('span'), //browser supports drag capabilities
		formdata: !!window.FormData, //browser can create form data
		progress: "upload" in new XMLHttpRequest //real-time progress status supported
    } 
	support = {
		filereader: document.getElementById('filereader'),
		formdata: document.getElementById('formdata'),
		progress: document.getElementById('progress')
	}
	acceptedTypes = {
		'image/png': true,
		'image/jpeg': true,
		'image/gif': true,
		'application/octet-stream': true
	}
	fileupload = document.getElementById('upload')
	
	"filereader formdata progress".split(' ').forEach(function (api) //according to browser supportability show/hide messages
	{
		if (tests[api] === false) 
		{
			support[api].className = 'fail';
		} 
		else 
		{
			support[api].className = 'hidden';
		}
	})
	if (tests.dnd) 
	{ 
		holder.ondragover = function () { this.className = 'hover'; return false; }
		holder.ondragend = function () { this.className = ''; return false; }
		holder.ondrop = function (e) 
		{
			this.className = ''
			e.preventDefault()
			readfiles(e.dataTransfer.files)
		}
	} 
	else 
	{
		fileupload.className = 'hidden'
		fileupload.querySelector('input').onchange = function () 
		{
			readfiles(this.files) //this triggers the uploading
		}
	}
	mode = 'none'
	template = '1'
	toggleButtons()
}

/*
* enter edit mode: modify existing objects and add new ones
*/
function edit()
{
	if(mode == 'none') //enter edit mode
	{
		console.log('enter edit mode')
		mode = 'edit'
		toggleButtons()
	}
	else if(mode == 'edit')//save changes and exit edit mode
	{
		console.log('exit edit mode')
		mode = 'none'
		toggleButtons()
		if( composition.pieces.length != 0 )
		{
			setModal( 'save','composition' )
			$('#btn-save').click(function(event){
				var filename = $('#input-save-filename').val()
				if(filename.indexOf( '.json' ) == -1 && filename.length != 0)
					filename = filename + '.json'
				var blob = exportCompositionTemplate()
				saveAs( blob, filename || 'composition.json')
			})
			$('#btn-share').click(function(event){
				setModal( 'share','composition' )
				$( '#modal-share' ).modal()
			})
			$('#btn-share-final').click(function(event){
				console.log('share template composition')
				var blob = exportCompositionTemplate()
				var dataUrl = composition.screenshot('thumbnail.png', false)
 				var blob2 = dataURItoBlob(dataUrl)
				shareMedia( 'composition', blob, blob2 )
			})
			$('#modal-save').modal()
		}
		else
		{
			myWarning( 'No pieces were found in the composition.' )
		}
	}
}

/*
* take a screenshot of the current 3D scene and save it locally
*/
function screenshot()
{
	if(mode == 'none')
	{
		console.log('enter sceenshot mode')
		if( composition.pieces.length != 0)
		{
			setModal( 'save','screenshot' )
			$('#btn-save').click(function(event){
				var filename = $('#input-save-filename').val()
				composition.screenshot( filename, true )
			})
			$('#btn-share').click(function(event){
				setModal( 'share','screenshot' )
				$('#modal-share').modal()
			})
			$('#btn-share-final').click(function(event){
				var dataUrl = composition.screenshot(filename,true)
 				var blob = dataURItoBlob(dataUrl)
				shareMedia( 'screenshot', blob, null )
			})
			$('#modal-save').modal()
		}
		else
		{
			myWarning( 'No pieces were found in the composition.' )
		}
	}
}

/*
* start recording of live feeds into 3D objects shapes
* distort meshes
* scale up/down
* rotate (counter)clockwise
* move along x-y
*/
function makemovie()
{
	if(mode == 'none') //start a new recording
	{
		console.log('enter makemovie mode')
		mode = 'makemovie'
		toggleButtons()
		var size = composition.getSize()
		var xhr = new XMLHttpRequest()
		var fd = new FormData(document.forms[0])
		var width = size['width']
		fd.append("width", width)
		var height = size['height']
		fd.append("height", height)
		xhr.onload = function(event){ //assign a unique ID to the client
			movieID = xhr.response
			//movieID = movieID.replace(/-/g,'')
			frameCounter = 0
			intervalMakeMovieID = setInterval(takeSceenshot,Math.ceil(60000/FRAMES_PER_MINUTE))
		}
		xhr.open('POST', '/movieid', true)
		xhr.send(fd)
	}
	else if(mode == 'makemovie') //stop an existing recording
	{
		console.log('exit makemovie mode')
		clearInterval(intervalMakeMovieID)
		mode = 'none'
		toggleButtons()
		setModal( 'save', 'movie' )
		$('#btn-save').click(function(event){
			var filename = $('#input-save-filename').val()
			var timestamp = new Date().getTime()
			var filename = (filename.replace(/ /g,'') || 'movie') + '_' + timestamp + '.mp4'
			var xhr = new XMLHttpRequest(), xhr_delete = new XMLHttpRequest()
			xhr.responseType = 'arraybuffer'
			var fd = new FormData(document.forms[0]), fd_delete = new FormData(document.forms[0])
			fd.append("movieid", movieID)
			fd.append("filename", filename)
			var saveMovie = function(event){
				if (xhr.status === 200) 
				{
					var dataView = new DataView(xhr.response)
				    var blob = new Blob([dataView],{ 'type' : 'movie/mp4'})
			    	saveAs(blob,filename)
					fd_delete.append("filename", movieID)
					xhr_delete.open('POST', '/delete', true)
					xhr_delete.send(fd_delete)
				}
			}
			xhr.open('POST', '/savemovie', true)
			xhr.onload = saveMovie
			xhr.send(fd)
		})
		$('#btn-share').click(function(event){
			setModal( 'share', 'movie' )
			$('#modal-share').modal()
		})
		$('#btn-share-final').click(function(event){
			var title = $('#input-title').val()
			var description = $('#input-description').val()
			var author = $('#input-author').val()
			var website = $('#input-website').val()
			var timestamp = new Date().getTime()
			var filename = (title.replace(/ /g,'') || 'movie') + '_' + timestamp + '.mp4'
			var xhr = new XMLHttpRequest()
			var fd = new FormData(document.forms[0])
			fd.append("filename", filename)
			fd.append("movieid", movieID)
			fd.append("author", author || 'anonymous')
			fd.append("description", description || 'no description')
			fd.append("title", title || 'no title')
			fd.append("website", website || '#')
			xhr.open('POST', '/sharemovie', true)
			while(recording)
			{
				console.log('waiting for recording to end')
			}
			xhr.send(fd)
		})
		$('#modal-save').modal()
	}
}

/*
* toggle fullscreen mode
*/
function fullscreen()
{
	if(mode == 'none') //toggle fullscreen
	{
		console.log('enter fullscreen mode')
		mode = 'fullscreen'
		toggleButtons()
		THREEx.FullScreen.request()
		screenfull.request()
	}
	else if(mode == 'fullscreen')
	{
		console.log('exit fullscreen mode')
		mode = 'none'
		toggleButtons()
		screenfull.exit()
    	THREEx.FullScreen.cancel()
	}
}

/*************************
/ UTILITIES and GENERAL PURPOSE functions
/*************************
/*
* take a screenshot -> another frame in the movie
*/
function takeSceenshot()
{
	recording = true
	var filename = frameCounter + '_frame.png'
	var dataUrl = composition.screenshot(filename,false)
	frameCounter++
	var blob = dataURItoBlob(dataUrl)
	var fd = new FormData(document.forms[0])
	var xhr = new XMLHttpRequest()
	fd.append("img", blob, filename)
	fd.append("movieid", movieID)
	xhr.open('POST', '/frame', true)
	var screenshottaken = function(event){
		recording = false
	}
	xhr.onload = screenshottaken
	xhr.send(fd)
}

/*
* upload a .obj file to the server (remote)
* load a .json as a composition template (local)
*/
function readfiles(files)
{
	//debugger
	var formData = tests.formdata ? new FormData() : null
	var filename = files[0].name
	if( filename.indexOf('.json') != -1 )
	{
		importCompositionTemplate( files[0] )
		return 1
	}
	else if( filename.indexOf('.obj') != -1 )
	{
		if (tests.formdata) 
			formData.append('fileupload', files[0])
		toggleUploadUI( 'uploading' )
		// now post a new XHR request
		if (tests.formdata) 
		{
			var xhr = new XMLHttpRequest()
			xhr.open('POST', '/compose',true)
			xhr.onload = function() 
			{
				progress.value = progress.innerHTML = 100
				filename = xhr.getResponseHeader("Location")
				filename = filename.replace('http://cisonogiatutte.com:5000/','')
				console.log(filename)
				toggleUploadUI( 'uploaded' )
				var url = "/download?filename=" + filename + "&mimetype=text/json&folder=objects"
				composition.createPiece( url, filename, 0, 0, 1, 0, 0, 0 )
			}
			if (tests.progress) 
			{
				xhr.upload.onprogress = function (event) 
				{
					if (event.lengthComputable) 
					{
						var complete = (event.loaded / event.total * 100 | 0) + '%'
						$('#upload-bar').css('width',complete)
					}
				}
			}
			xhr.send(formData)
		}
	}
	else
	{
		myAlert('UNRECOGNIZED file extension (allowed extensions: .obj and .json)', 'error')
	}
}

/*
* export and save the composition settings into a JSON file
*/
function exportCompositionTemplate()
{
	var objJSON = {}
	var piecesJSON = {}
	var tmpJSON = {}
	tmpJSON['formatVersion'] = '0.1'
	tmpJSON['extension'] = '.json'
	tmpJSON['generatedOn'] = new Date()
	tmpJSON['sourceType'] = 'TWITIO'
	tmpJSON['pieces'] = 1
	objJSON['metadata'] = tmpJSON
	for(var i=0; i < composition.pieces.length; i++)
	{
		tmpJSON = {}
		tmpJSON['filename'] = composition.pieces[i].filename
		tmpJSON['x'] = composition.pieces[i].x
		tmpJSON['y'] = composition.pieces[i].y
		tmpJSON['scale'] = composition.pieces[i].scale
		tmpJSON['rotX'] = composition.pieces[i].rotX
		tmpJSON['rotY'] = composition.pieces[i].rotY
		tmpJSON['rotZ'] = composition.pieces[i].rotZ
		tmpJSON['DISPLACEMENT'] = composition.pieces[i].DISPLACEMENT
		tmpJSON['SPRING_STRENGTH'] = composition.pieces[i].SPRING_STRENGTH
		tmpJSON['DAMPEN'] = composition.pieces[i].DAMPEN
		var objID = 'obj-' + i
		piecesJSON[objID] = tmpJSON
	}
	objJSON['pieces'] = piecesJSON
	//create a JSON string and save it into a file
	var textJSON = JSON.stringify(objJSON)
	var arrayBuffer = str2ab(textJSON)
	var dataView = new DataView(arrayBuffer)
	var blob = new Blob([dataView],{ 'type' : 'text/json'})
	return blob
}

/*
* import and load the composition settings from an external JSON file
*/
function importCompositionTemplate( _file )
{
	var r = new FileReader()
	r.onload = function(e) 
	{
		var contents = e.target.result
		for(var i = 0; i < contents.length; i++)
		{
			if(contents.charCodeAt(i) == 0 )
			{
				contents = contents.replaceAt(i, '')
			}
		}
		var objJSON = {}
		objJSON = JSON.parse(contents)
		console.log(objJSON	)
	}
	r.readAsText( _file )
}

/*
* share media (screenshotr and comnpositions) -> save in Amazon S3
*/
function shareMedia( _type, _blob, _blob2 )
{
	var title = $('#input-title').val()
	var description = $('#input-description').val()
	var author = $('#input-author').val()
	var website = $('#input-website').val()
	var timestamp = new Date().getTime()
	var extension = ''
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	if( _type == 'screenshot' )
	{
		xhr.open('POST', '/sharescreenshot', true)
		extension = '.png'		
	}
	if( _type == 'composition' )
	{
		xhr.open('POST', '/sharecomposition', true)
		fd.append("thumbnail", _blob2, 'thumbnail_' + timestamp + '.png')
		extension = '.json'
	}
	var filename = (title.replace(/ /g,'') || _type) + '_' + timestamp + extension
	fd.append("file", _blob, filename)
	fd.append("author", author || 'anonymous')
	fd.append("description", description || 'no description')
	fd.append("title", title || 'no title')
	fd.append("website", website || '#')
	xhr.send(fd)
}

/*
* load template composition (1, 2 or 3) or create a new empty composition
*/
function loadComposition( _composition )
{
	template = _composition
	toggleButtonsTemplate()
	if( _composition == 'new' )
	{
		for(var i = 0; i < composition.pieces.length; i++)
			composition.scene.removeObject(composition.pieces[0].object)
		composition.pieces = []
		mode = 'edit'
		toggleButtons()
	}
	else
	{
		//load a template
	}
}

/*******************************
/ UI functions
/*******************************
/*
* custom alert modal window -> it can be for info and error messages
*/
function myAlert( _msg, _level )
{
	if( _level == 'info' )
	{
		$('#modal-alert-label').html('TWITIO - info')
		$('#msg-info').html( _msg )
		$('#msg-info').css('display','block')
		$('#msg-error').css('display','none')
	}
	else if( _level == 'error' )
	{
		$('#modal-alert-label').html('TWITIO - error')
		$('#msg-error').html( _msg )
		$('#msg-error').css('display','block')
		$('#msg-info').css('display','none')
	}
	$('#modal-alert').modal()
}

/*
* custom warning message at bottom page -> send empty _msg to kill it
*/
function myWarning( _msg )
{
	if( _msg.length != 0 )
	{
		$('#alert-warnings').html('<div style="margin-top: 6px; margin-bottom: 0px;" class="alert"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Warning!</strong> ' + _msg + '</div>' )
		$('#alert-warnings').css('display','block')
		$('#divider-warnings').css('display','block')
	}
	else
	{
		$('#alert-warnings').css('display','none')
		$('#divider-warnings').css('display','none')
	}
}

/*
* toggle the UI appearance according to the upload state
* - off
* - on (but nothing has been uploaded/uploding)
* - uploading (in the mid of an upload)
* - uploaded (an upload has been completed)
*/
function toggleUploadUI( _mode ) {
	switch( _mode )
	{
		case('uploading'):
			$('#upload-bar').css('width','0%')
			$('#upload-bar-container').css('display','block')
			$('#info-container').css('display','none')
			break
		case('uploaded'):
			$('#info-container').css('display','block')
			$('#upload-bar-container').css('display','none')
			break
		case('off'):
			$('#upload-container').css('display','none')
			break
		case('on'):
			$('#upload-bar-container').css('display','none')
			$('#upload-container').css('display','block')
			break
	}
}

/*
* toggle the visibility of the loading gif (different from the upload progress bar)
*/
function loadingGif( _status ){
	if( _status == 'on')
		$('#icon-loading').css('visibility','visible')
	else	
		$('#icon-loading').css('visibility','hidden')
}

/*
* preset modal window
*/
function setModal( _type,_mode )
{
	if(_type == 'save')
	{
		$('#btn-save').unbind()
		$('#btn-share').unbind()
		$('#btn-share-final').unbind()
		switch( _mode )
		{
			case('screenshot'):
				$('#modal-save-label').html('Save screenshot')
				$('#input-save-filename').attr('placeholder','screenshot.jpg')
				break
			case('movie'):
				$('#modal-save-label').html('Save movie')
				$('#input-save-filename').attr('placeholder','movie.mp4')
				break
			case('composition'):
				$('#modal-save-label').html('Export composition')
				$('#input-save-filename').attr('placeholder','composition.json')
				break
		}
	}
	else if( _type == 'share')
	{
		switch( _mode )
		{
			case('screenshot'):
				$('#modal-share-label').html('Share screenshot')
				break
			case('movie'):
				$('#modal-share-label').html('Share movie')
				break
			case('composition'):
				$('#modal-share-label').html('Share composition')
				break
		}
	}
}

/*
* change the appearance of the button for selecting existing composition template or creating a new composition
*/
function toggleButtonsTemplate()
{
	if( mode == 'none' )
	{
		switch( template )
		{
			case( '1' ):
				$('#btn-comp-1').attr('class','btn btn-large btn-success enabled')
				$('#btn-comp-2').attr('class','btn btn-large enabled')
				$('#btn-comp-new').attr('class','btn btn-large enabled')
				break
			case( '2' ):
				$('#btn-comp-1').attr('class','btn btn-large enabled')
				$('#btn-comp-2').attr('class','btn btn-large btn-success enabled')
				$('#btn-comp-new').attr('class','btn btn-large enabled')
				break
			case( 'new' ):
				$('#btn-comp-1').attr('class','btn btn-large enabled')
				$('#btn-comp-2').attr('class','btn btn-large enabled')
				$('#btn-comp-new').attr('class','btn btn-large enabled')
				break
		}
	}
	else
	{
		switch( template )
		{
			case( '1' ):
				$('#btn-comp-1').attr('class','btn btn-large btn-success disabled')
				$('#btn-comp-2').attr('class','btn btn-large disabled')
				$('#btn-comp-new').attr('class','btn btn-large disabled')
				break
			case( '2' ):
				$('#btn-comp-1').attr('class','btn btn-large disabled')
				$('#btn-comp-2').attr('class','btn btn-large btn-success disabled')
				$('#btn-comp-new').attr('class','btn btn-large disabled')
				break
			case( 'new' ):
				$('#btn-comp-1').attr('class','btn btn-large disabled')
				$('#btn-comp-2').attr('class','btn btn-large disabled')
				$('#btn-comp-new').attr('class','btn btn-large disabled')
				break
		}
	}
}

/*
* change button appeareance according to selected mode
*/
function toggleButtons()
{
	myWarning( '' )
	switch( mode )
	{
		case('none'):
			$('#btn-edit').html("<i class='icon-wrench icon-white'></i>")
			$('#btn-edit').attr('title','edit/add 3D objects')
			$('#btn-screenshot').html("<i class='icon-camera icon-white'></i>")
			$('#btn-makemovie').html("<i class='icon-film icon-white'></i>")
			$('#btn-fullscreen').html("<i class='icon-fullscreen icon-white'></i>")
			$('#btn-edit').attr('class','btn btn-primary btn-large enabled')
			$('#btn-makemovie').attr('class','btn btn-primary btn-large enabled')
			$('#btn-screenshot').attr('class','btn btn-primary btn-large enabled')
			$('#btn-fullscreen').attr('class','btn btn-primary btn-large enabled pull-right')
			toggleUploadUI( 'off' )
			toggleButtonsTemplate()
			break
		case('edit'):
			$('#btn-edit').html("<i class='icon-ok icon-white'></i>")
			$('#btn-edit').attr('title','stop editing')
			$('#btn-edit').attr('class','btn btn-success btn-large')
			$('#btn-screenshot').attr('class','btn btn-primary btn-large disabled')
			$('#btn-makemovie').attr('class','btn btn-primary btn-large disabled')
			$('#btn-fullscreen').attr('class','btn btn-primary btn-large disabled pull-right')
			toggleUploadUI( 'on' )
			toggleButtonsTemplate()
			break
		case('makemovie'):
			$('#btn-makemovie').html("<i class='icon-stop icon-white'></i>")
			$('#btn-makemovie').attr('class','btn btn-danger btn-large')
			$('#btn-edit').attr('class','btn btn-primary btn-large disabled')
			$('#btn-screenshot').attr('class','btn btn-primary btn-large disabled')
			$('#btn-fullscreen').attr('class','btn btn-primary btn-large disabled pull-right')
			toggleUploadUI( 'off' )
			toggleButtonsTemplate()
			break
		case('fullscreen'):
			$('#btn-fullscreen').html("<i class='icon-resize-small icon-white'></i>")
			$('#btn-makemovie').attr('class','btn btn-primary btn-large')
			toggleUploadUI( 'off' )
			toggleButtonsTemplate()
			break
	}
}
function download(filename, type)
{
	var xhr = new XMLHttpRequest(), xhr_delete = new XMLHttpRequest()
	var mimetype
	var fd = new FormData(document.forms[0]), fd_delete = new FormData(document.forms[0])
	xhr.responseType = 'arraybuffer'
	if(type == 'screenshot')
	{
		fd.append('folder','gallery')
		mimetype = 'image/png'	
	}
	else if(type == 'movie')
	{
		fd.append('folder','movies')
		mimetype = 'movie/mp4'
		filename = filename + '.mp4'
	}
	else if(type == 'composition')
	{
		fd.append('folder','compositions')
		mimetype = 'text/json'
	}
	else
	{
		return -1
	}
	fd.append('filename', filename)
	fd.append('mimetype',mimetype)
	xhr.open('POST','/download',true)
	xhr.onload = function(event){
		var dataView = new DataView(xhr.response)
		var blob = new Blob([dataView],{ 'type' : mimetype})
		saveAs(blob,filename)
		fd_delete.append("filename", filename)
		xhr_delete.open('POST', '/delete', true)
		xhr_delete.send(fd_delete)	
	}
	xhr.send(fd)
}/**
* Converts a mimetype image into a js object
* the object can be then appended to a form
* the form can be posted to a server
*/
function dataURItoBlob(dataURI, callback) 
{
	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
	var byteString = atob(dataURI.split(',')[1])
	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
	// write the bytes of the string to an ArrayBuffer
	var ab = new ArrayBuffer(byteString.length)
	var ia = new Uint8Array(ab)
	for (var i = 0; i < byteString.length; i++) 
	{
		ia[i] = byteString.charCodeAt(i)
	}
	// write the ArrayBuffer to a blob, and you're done
	//var bb = new WebKitBlobBuilder() || new MozBlobBuilder();
	window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder
    if( typeof window.BlobBuilder !== 'undefined')
    {
    	var bb = new window.BlobBuilder();
		bb.append(ab)
		return bb.getBlob(mimeString)
	}
	else
	{
		var i = ia.length;
    	var binaryString = new Array(i);
    	while (i--)
	    {
      		binaryString[i] = String.fromCharCode(ia[i]);
    	}
    	var blob
    	if (typeof window.DataView != 'undefined')
    	{
    		//var av = new ArrayBufferView(ab,byteString.length,0)
    		var dataView = new DataView(ab)
			blob = new Blob([dataView], { "type" : mimeString})
		}
		else
		{
			blob = new Blob([ab], { "type" : mimeString})
		}	
		return blob
	}
}

function base64ArrayBuffer(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }

  return base64
}

function str2ab( _str ) 
{
	var buf = new ArrayBuffer( _str.length*2) // 2 bytes for each char
	var bufView = new Uint16Array(buf)
	for (var i=0, strLen=_str.length; i<strLen; i++) 
	{
		bufView[i] = _str.charCodeAt(i)
	}
	return buf
}

String.prototype.replaceAt = function ( _index, _char ) {
	if ( _index > this.length || _index < 0 )
		return this.substr(0, this.length)
	else
		return this.substr(0, _index) + _char + this.substr(_index + 1, this.length)
}