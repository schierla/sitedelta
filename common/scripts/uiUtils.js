var uiUtils = {
	i18n: function() {
		var elems = document.querySelectorAll(".i18n");
		for(var i=0; i<elems.length; i++) {
			if(elems[i].getAttribute("title")) 
				elems[i].setAttribute("title", uiUtils._translate(elems[i].getAttribute("title")));
			if(elems[i].firstChild && elems[i].firstChild.data)
				elems[i].firstChild.data = uiUtils._translate(elems[i].firstChild.data); 
		}
	},
	_translate: function(key) {
		if(key.startsWith("__MSG_") && key.endsWith("__")) {
			key = key.substr(6, key.length-8);
			key = chrome.i18n.getMessage(key);
		}
		return key;
	}
};
