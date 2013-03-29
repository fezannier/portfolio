function editProject(id, elem)
{
	var generator = xml2string(this.event.target)
	if( generator.indexOf('<i class="icon-trash icon-white">') != -1)
		deleteProject(id , elem)
	else if( generator.indexOf('<i class="icon-chevron-') != -1)
		rankProject(id, elem)
	else
		window.location = '/portfolio/edit?id=' + id 
}

function deleteProject(id, elem)
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	fd.append("id", id)
	xhr.open('POST','/portfolio/delete',true)
	xhr.onload = function(event)
	{
	}
	xhr.send(fd)
}

function deleteLine(object) 
{
	var table = document.getElementById("table")
	var tBody = table.getElementsByTagName("tbody")[0]
	var rows = tBody.getElementsByTagName("tr")
	while (object.tagName != 'TR') 
	{
		object = object.parentNode
	}
	var row = rows[object.rowIndex]
	tBody.removeChild(row)
}

function logout()
{
	window.location = '/portfolio/logout'
}

function xml2string(node) 
{
	if (typeof(XMLSerializer) !== 'undefined') 
	{
		var serializer = new XMLSerializer();
		return serializer.serializeToString(node);
	} 
	else if (node.xml) 
	{
		return node.xml;
	}
}

function rankProject(id, elem)
{
	if(typeof elem !== "undefined")
	{
		var action = elem.getAttribute('id')
		var rowId = '#' + id
		var rankId = '#rank-' + id
		var rank = parseInt($(rankId).html())
		if(action == 'down')
		{
			var nextId = $(rowId).next().attr('id')
			updateRank(nextId, rank, id, rank + 1)
			$(rowId).next().after(jQuery(rowId))
		}
		else
		{
			if(rank != 1)
			{
				var prevId = $(rowId).prev().attr('id')
				updateRank(prevId, rank, id, rank - 1)
				$(rowId).prev().before(jQuery(rowId))
			}
		}
	}
}

function updateRank(id_1, rank_1, id_2, rank_2 )
{
	var xhr = new XMLHttpRequest()
	var fd = new FormData(document.forms[0])
	fd.append("id_1", id_1)
	fd.append("rank_1", rank_1)
	if(id_2 != null)
	{
		fd.append("id_2", id_2)
		fd.append("rank_2", rank_2)
	}
	xhr.open('POST','/portfolio/rank',true)
	xhr.onload = function(event)
	{
		if(id_2 != null)
		{
			var selector = '#rank-' + id_1
			$(selector).html(rank_1)
			selector = '#rank-' + id_2
			$(selector).html(rank_2)
		}
	}
	xhr.send(fd)
}

$('#myProjects a').click(function (e) 
{
	e.preventDefault()
	$(this).tab('show')
})

$('#myProjects a[href="#archived"]').tab('archived')