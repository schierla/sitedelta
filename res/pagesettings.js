window.onload=function() {
	var url = window.location.search.substr(1);
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			console.log("Received " + xhr.responseText);
			var parser = new DOMParser();
			var doc = parser.parseFromString(xhr.responseText, "text/html");
			var idoc = document.getElementById("iframe").contentWindow.document;
			idoc.appendChild(idoc.importNode(doc.body, true));
		}
	};
	xhr.open("GET", url, true);
	xhr.send();
}

