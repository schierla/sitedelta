window.onload = function() {
	var url = window.location.search.substr(1);
	if (url == "") url = "about:blank";
	var iframe = document.getElementById("iframe");
	iframe.style.visibility = "hidden";
	iframe.onunload = function() {
		console.log("unload" + iframe.src);
	}
	var idoc = iframe.contentWindow.document;
	while(idoc.firstChild) idoc.removeChild(idoc.firstChild);
	watchUtils.loadPage(url, function(doc) {
		var idoc = iframe.contentWindow.document;
		document.title = doc.title;
		var base = doc.createElement("base");
		base.setAttribute("href", url);
		doc.head.appendChild(base);

		var adopted = idoc.adoptNode(doc.documentElement);
		idoc.appendChild(adopted);
		idoc.body.addEventListener("click", stopIt, true);

		iframe.style.visibility = "visible";
		watchUtils.setChanges(url, 1);
	});
}

function stopIt(e) {
	// console.log(e.target.href);
	window.location.search = e.target.href;
	e.preventDefault();
	e.stopPropagation();
	return false;
}
