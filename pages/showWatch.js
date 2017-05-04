window.onload=function() {
	var url = window.location.search.substr(1);
	if (url == "") url = "about:blank";
	var iframe = document.getElementById("iframe");
	iframe.style.visibility = "hidden";
	var idoc = iframe.contentWindow.document;
	while(idoc.firstChild) idoc.removeChild(idoc.firstChild);
	
	download(url, "");
}

function stopIt(e) {
	e.preventDefault();
	e.stopPropagation();
	return false;
}

function download(url, mime) {
	var xhr = new XMLHttpRequest();
	if(mime != "") 
		xhr.overrideMimeType(mime);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if(mime == "" && xhr.getResponseHeader("content-type"))
				mime = xhr.getResponseHeader("content-type");
			show(iframe, url, mime, xhr.responseText);
		}
	};
	xhr.open("GET", url, true);
	xhr.send();
}

function show(iframe, url, mime, text) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(text, "text/html");
	if(mime.toLowerCase().indexOf("charset")<0) {
		var metas = doc.getElementsByTagName("meta");
		for(var i=0; i<metas.length; i++) {
			if(metas.item(i).getAttribute("http-equiv").toLowerCase()=="content-type") {
				mime = metas.item(i).getAttribute("content");
				if(mime.toLowerCase().indexOf("charset") > 0) {
					download(url, mime);
					return;
				}
			}
		}
	}

	var idoc = iframe.contentWindow.document;
	var base = doc.createElement("base");
	base.setAttribute("href", url);
	doc.head.appendChild(base);

	var adopted = idoc.adoptNode(doc.documentElement);
	idoc.appendChild(adopted);
	idoc.body.addEventListener("click", stopIt, true);

	iframe.style.visibility = "visible";
}