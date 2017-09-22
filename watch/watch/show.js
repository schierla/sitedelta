

function highlight() {
	pageUtils.getOrCreateEffectiveConfig(url, title, (config) => {
		window.config = config;
		pageUtils.getContent(url, function(content) {
			var iframe = document.getElementById("iframe");
			var idoc = iframe.contentWindow.document;
			known = true;
			var newcontent = textUtils.getText(idoc, config);
			changes = highlightUtils.highlightChanges(idoc, config, content);
			if(changes > 0) {
				current = highlightUtils.highlightNext(idoc, 0);
			}
			watchUtils.setChanges(url, 0);
			pageUtils.setContent(url, newcontent, () => {
				showData();
			});
		});
	});
}

function stopIt(e) {
	if(!known && e.target && e.target.href) {
		window.location.search = e.target.href;
	} else {
		e.preventDefault();
		e.stopPropagation();
		return false;
	}
}

function loadPage(callback) {
	var iframe = document.getElementById("iframe");
	changes = -1; current = -1;
	iframe.style.visibility = "hidden";
	var idoc = iframe.contentWindow.document;
	while(idoc.firstChild) idoc.removeChild(idoc.firstChild);
	watchUtils.loadPage(url, function(doc) {
		var idoc = iframe.contentWindow.document;
		if(title == "") title = doc.title;
		var base = doc.createElement("base");
		base.setAttribute("href", url);
		doc.head.insertBefore(base, doc.head.firstChild);
		var adopted = idoc.adoptNode(doc.documentElement);
		idoc.appendChild(adopted);
		idoc.body.addEventListener("click", stopIt, true);
		iframe.style.visibility = "visible";
		callback();
	});
}


function registerListeners() {
	for(var i=0; i<options.length; i++) {
		registerListener(options[i]);
	}
}
function registerListener(option) {
	var performUpdate = (value) => {
		pageUtils.setConfigProperty(url, option.key, value, () => {
			if(option.post) option.post();
		});
	};
	document.querySelector("#"+option.elem).addEventListener("change", function(e) {
		var value = "";
		if(option.type=="text") { 
			value = document.querySelector("#"+option.elem).value;
		} else if(option.type=="checkbox") { 
			value = document.querySelector("#"+option.elem).checked;
		} else if(option.type == "list") {
			value = document.querySelector("#"+option.elem).value;
			for(var i=0; i<options.length; i++) {
				if(options[i] != option && options[i].type=="list") { 
					document.querySelector("#" + options[i].delelem).setAttribute("disabled", "disabled");
					document.querySelector("#" + options[i].elem).value = null;
					if(options[i].select) options[i].select(null);
				}
			}
			document.querySelector("#" + option.delelem).removeAttribute("disabled");
			if(option.select) option.select(value); 
			return;
		}
		if(option.pre) option.pre(value, performUpdate); else performUpdate(value);
	});
	if(option.type == "list") {
		document.querySelector("#"+option.addelem).addEventListener("click", function(e) {
			option.add(value => {
				var newlist = [];
				for(var i=0; i<option.contents.length; i++) {
					newlist.push(option.contents[i]);
				}
				newlist.push(value);
				if(option.pre) option.pre(newlist, performUpdate); else performUpdate(newlist);
			});
		});
		document.querySelector("#"+option.delelem).addEventListener("click", function(e) {
			var value = document.querySelector("#" + option.elem).value, newlist = [];
			for(var i=0; i<option.contents.length; i++) {
				if(option.contents[i] != value) newlist.push(option.contents[i]);
			}
			if(option.select) option.select(null);
			if(option.pre) option.pre(newlist, performUpdate); else performUpdate(newlist);
		});
	}
}

function showOptions() {
	pageUtils.getEffectiveConfig(url, config => {
		for(var i=0; i<options.length; i++) {
			if(options[i].type=="text")
				document.querySelector("#"+options[i].elem).value = config[options[i].key];
			else if(options[i].type=="checkbox") 
				document.querySelector("#"+options[i].elem).checked = config[options[i].key];
			else if(options[i].type=="list") {
				var list = document.querySelector("#" + options[i].elem);
				while(list.firstChild) list.removeChild(list.firstChild);
				options[i].contents = config[options[i].key];
				for(var j=0; j<config[options[i].key].length; j++) {
					var item = config[options[i].key][j];
					var node = document.createElement("option");
					node.setAttribute("value", item);
					node.appendChild(document.createTextNode(item));
					list.appendChild(node);
				}
				document.querySelector("#" + options[i].delelem).setAttribute("disabled", "disabled"); 
			}
		}
	});
}

function getStatusText() {
	if(known) {
		if(changes > 0)
			return chrome.i18n.getMessage("highlightTitleChanges", [current, changes]);
		else if(changes == 0) 
			return chrome.i18n.getMessage("highlightTitleNoChanges");
		else
			return chrome.i18n.getMessage("watchEnabled");
	} else {
		return chrome.i18n.getMessage("watchDisabled");
	}
}

function showData() {
	document.querySelector("#pagetitle").value = title;
	document.title = title;
	document.querySelector("#delete").style.display = known ? "inline" : "none";
	document.querySelector("#statustext").firstChild.data = getStatusText();
}




function selectRegion(callback) {
	var iframe = document.getElementById("iframe");
	var idoc = iframe.contentWindow.document;
	regionUtils.selectRegion(idoc, callback);
}

function showOutline(outline, color) {
	var iframe = document.getElementById("iframe");
	var idoc = iframe.contentWindow.document;
	if(outline) {
		regionUtils.showOutline(idoc, outline, color);
	} else {
		regionUtils.removeOutline(idoc);
	}
}

function addBodyIfEmpty(list, callback) {
	if(list.length == 0) list.push("/html/body[1]");
	callback(list);
}


uiUtils.i18n();


var options = [
	{type: "checkbox", key: "checkDeleted",    elem: "checkdeleted"},
	{type: "checkbox", key: "scanImages",      elem: "checkimages"},
	{type: "checkbox", key: "ignoreCase",      elem: "ignorecase"},
	{type: "checkbox", key: "ignoreNumbers",   elem: "ignorenumbers"},
	{type: "list",     key: "includes",        elem: "include", addelem: "includeadd", delelem: "includedel", select: xpath => showOutline(xpath,config.includeRegion), add: selectRegion, pre:addBodyIfEmpty, post:showOptions},
	{type: "list",     key: "excludes",        elem: "exclude", addelem: "excludeadd", delelem: "excludedel", select: xpath => showOutline(xpath,config.excludeRegion), add: selectRegion, post:showOptions}
];

var url = window.location.search.substr(1);
if (url == "") url = "about:blank";

var known = false;
var title = "";
var changes = -1, current = -1;
var config = {};


pageUtils.getTitle(url, pagetitle => {
	if(pagetitle != null) {
		known = true;
		title = pagetitle;
	}
	loadPage(() => {
		showData();
		if(known) highlight();	
	});
});


registerListeners();

document.querySelector("#pagetitle").addEventListener("change", function(e) {
	title = document.querySelector("#pagetitle").value;
	pageUtils.setTitle(url, title, function() {});
	showData(); 
});


document.querySelector("#delete").addEventListener("click", function(e) {
	pageUtils.remove(url, function() {
		watchUtils.removeAlarm(url);
		chrome.tabs.getCurrent((current) => {
			chrome.tabs.remove(current.id);
		});
	});
});

document.querySelector("#expand").addEventListener("click", function(e) {
	pageUtils.getOrCreateEffectiveConfig(url, title, config => {
		known = true;
		window.config = config;
		loadPage(showData);
		showOptions();
		document.body.classList.remove("collapsed");
	});
});

document.querySelector("#highlight").addEventListener("click", function(e) {
	document.body.classList.add("collapsed");
	if(changes > 0) {
		var iframe = document.getElementById("iframe");
		var idoc = iframe.contentWindow.document;
		current = highlightUtils.highlightNext(idoc, current);
		showData();
	} else {
		highlight();
	};
});