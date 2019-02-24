function highlight() {
	if (document.body.classList.contains("selecting")) {
		regionUtils.abortSelect();
	}
	if (document.body.classList.contains("loadfail")) return;
	document.body.classList.remove("selecting", "unchanged", "changed", "expanded");
	document.body.classList.add("known");
	pageUtils.getOrCreateEffectiveConfig(url, title, (config) => {
		window.config = config;
		pageUtils.getContent(url, function (content) {
			window.oldcontent = content;
			var iframe = document.getElementById("iframe");
			var idoc = iframe.contentWindow.document;
			known = true;

			var newcontent = textUtils.getText(idoc, config);
			pageUtils.setContent(url, newcontent);

			changes = highlightUtils.highlightChanges(idoc, config, content);
			if (changes > 0) {
				document.body.classList.add("changed");
				setTimeout(() => {
					current = highlightUtils.highlightNext(idoc, 0);
					showData();
				}, 200);
			} else if (changes == 0) {
				document.body.classList.add("unchanged");
			} else {
				document.body.classList.add("failed");
			}
			showData();
			if(changes >= 0)
				watchUtils.setChanges(url, 0);
			else
				watchUtils.setChanges(url, -1);
		});
	});
}

function stopIt(e) {
	if (document.body.classList.contains("expanded")) {
		e.preventDefault();
		e.stopPropagation();
		return;
	}
	if (e.ctrlKey) return;
	var target = e.target;
	while (target != null) {
		if (target.href) {
			window.location.search = target.href;
			return;
		}
		target = target.parentNode;
	}
	e.preventDefault();
	e.stopPropagation();
}

function showPage(doc, callback) {
	if (doc === null) return (callback !== undefined) ? callback() : null;
	if (title == "") title = doc.title;
	var idoc = iframe.contentWindow.document;
	while (idoc.firstChild) idoc.removeChild(idoc.firstChild); idoc.appendChild(idoc.importNode(doc.documentElement, true)); 
	idoc.body.addEventListener("click", stopIt, true);
	return (callback !== undefined) ? callback() : null;
}

function loadPage(callback) {
	document.body.classList.remove("loaded", "loadfail");
	var iframe = document.getElementById("iframe");
	changes = -1; current = -1; loadedDocument = null;
	watchUtils.loadPage(url, function (doc) {
		if (doc === null) {
			document.body.classList.add("loadfail");
		} else {
			document.body.classList.add("loaded");
		}
		var base = doc.createElement("base");
		base.setAttribute("href", url);
		if(!doc.querySelector("base[href]")) doc.head.insertBefore(base, doc.head.firstChild);
		loadedDocument = doc;
		showPage(loadedDocument, callback);
	}, (loaded, total) => {
		document.getElementById("progress").style.width = ((loaded / total) * 100) + "%";
	});
}


function registerListeners() {
	for (var i = 0; i < options.length; i++) {
		registerListener(options[i]);
	}
}
function registerListener(option) {
	var performUpdate = (value) => {
		pageUtils.setConfigProperty(url, option.key, value, () => {
			if (option.post) option.post();
			if (option.type == "text") document.querySelector("#" + option.elem).value = value;
			else if (option.type == "checkbox") document.querySelector("#" + option.elem).checked = value;
		});
	};
	document.querySelector("#" + option.elem).addEventListener("change", function (e) {
		var value = "";
		if (option.type == "text") {
			value = document.querySelector("#" + option.elem).value;
		} else if (option.type == "checkbox") {
			value = document.querySelector("#" + option.elem).checked;
		} else if (option.type == "list") {
			value = document.querySelector("#" + option.elem).value;
			for (var i = 0; i < options.length; i++) {
				if (options[i] != option && options[i].type == "list") {
					document.querySelector("#" + options[i].delelem).setAttribute("disabled", "disabled");
					document.querySelector("#" + options[i].elem).value = null;
					if (options[i].select) options[i].select(null);
				}
			}
			document.querySelector("#" + option.delelem).removeAttribute("disabled");
			if (option.select) option.select(value);
			return;
		}
		if (option.pre) option.pre(value, performUpdate); else performUpdate(value);
	});
	if (option.type == "list") {
		document.querySelector("#" + option.elem).addEventListener("dblclick", function (e) {
			if (option.edit) {
				var oldValue = document.querySelector("#" + option.elem).value;
				if (oldValue === "") return;
				option.edit(oldValue, newValue => {
					if (newValue === null || newValue === "") return;
					var newlist = [];
					for (var i = 0; i < option.contents.length; i++) {
						if (option.contents[i] != oldValue)
							newlist.push(option.contents[i]);
						else
							newlist.push(newValue);
					}
					if (option.pre) option.pre(newlist, performUpdate); else performUpdate(newlist);
				});
			}
		});
		document.querySelector("#" + option.addelem).addEventListener("click", function (e) {
			option.add(value => {
				var newlist = [];
				for (var i = 0; i < option.contents.length; i++) {
					newlist.push(option.contents[i]);
				}
				newlist.push(value);
				if (option.pre) option.pre(newlist, performUpdate); else performUpdate(newlist);
			});
		});
		document.querySelector("#" + option.delelem).addEventListener("click", function (e) {
			var value = document.querySelector("#" + option.elem).value, newlist = [];
			for (var i = 0; i < option.contents.length; i++) {
				if (option.contents[i] != value) newlist.push(option.contents[i]);
			}
			if (option.select) option.select(null);
			if (option.pre) option.pre(newlist, performUpdate); else performUpdate(newlist);
		});
	}
}

function showOptions() {
	pageUtils.getEffectiveConfig(url, config => {
		for (var i = 0; i < options.length; i++) {
			if (options[i].type == "text")
				document.querySelector("#" + options[i].elem).value = config[options[i].key];
			else if (options[i].type == "checkbox")
				document.querySelector("#" + options[i].elem).checked = config[options[i].key];
			else if (options[i].type == "list") {
				var list = document.querySelector("#" + options[i].elem);
				while (list.firstChild) list.removeChild(list.firstChild);
				options[i].contents = config[options[i].key];
				for (var j = 0; j < config[options[i].key].length; j++) {
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

function showData() {
	document.querySelector("#pagetitle").value = title;
	document.title = title;
	document.querySelector("#changed").firstChild.data = chrome.i18n.getMessage("pageChanged", [current, changes]);
	if(config.makeVisible) {
		setTimeout(function() {
			highlightUtils.makeVisible(document.getElementById("iframe").contentWindow.document, config);
		}, 200);
	}
}

function editRegion(xpath, callback) {
	showOutline(null);
	callback(prompt(chrome.i18n.getMessage("configRegionXpath"), xpath));
}

function selectRegion(callback) {
	var iframe = document.getElementById("iframe");
	var idoc = iframe.contentWindow.document;
	if (document.body.classList.contains("selecting") || document.body.classList.contains("loadfail")) {
		regionUtils.abortSelect();
		document.body.classList.remove("selecting");
		var region = prompt(chrome.i18n.getMessage("configRegionXpath"), "");
		return (region && callback !== undefined) ? callback(region) : null;
	} else {
		document.body.classList.add("selecting");
		regionUtils.selectRegionOverlay(document.querySelector("#overlay"), idoc, region => {
			document.body.classList.remove("selecting");
			return (region && callback !== undefined) ? callback(region) : null;
		});
	}
}

function showOutline(outline, color) {
	var iframe = document.getElementById("iframe");
	var idoc = iframe.contentWindow.document;
	if (outline) {
		regionUtils.showOutline(idoc, outline, color);
	} else {
		regionUtils.removeOutline(idoc);
	}
}

function addBodyIfEmpty(list, callback) {
	if (list.length == 0) list.push("/html/body[1]");
	if (list.length > 1 && list[0] == "/html/body[1]") list.splice(0, 1);
	return (callback !== undefined) ? callback(list) : null;
}

var options = [
	{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
	{ type: "checkbox", key: "scanImages", elem: "checkimages" },
	{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
	{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
	{ type: "checkbox", key: "makeVisible", elem: "makevisible", post: expand },
	{ type: "checkbox", key: "stripStyles", elem: "stripstyles", post: expand },
	{ type: "checkbox", key: "isolateRegions", elem: "isolateregions", post: expand },
	{ type: "list", key: "includes", elem: "include", addelem: "includeadd", delelem: "includedel", select: xpath => showOutline(xpath, config.includeRegion), add: selectRegion, edit: editRegion, pre: addBodyIfEmpty, post: showOptions },
	{ type: "list", key: "excludes", elem: "exclude", addelem: "excludeadd", delelem: "excludedel", select: xpath => showOutline(xpath, config.excludeRegion), add: selectRegion, edit: editRegion, post: showOptions },
	{ type: "text", key: "watchDelay", elem: "watchDelay", pre: (value, callback) => callback(parseInt(value)) }
];

var url = window.location.search.substr(1) + window.location.hash;
if (url == "") url = "about:blank";

var known = false;
var title = "";
var changes = -1, current = -1;
var config = {};
var loadedDocument = null;
var oldcontent = null;

function init() {
	pageUtils.getTitle(url, pagetitle => {
		if (pagetitle !== null) {
			document.body.classList.add("known");
			known = true;
			title = pagetitle;
		}
		chrome.permissions.contains({origins: [url] }, function(result) {
			if (result) {
				loadPage(() => {
					showData();
					if (known) highlight();
				});
			} else {
				document.body.classList.add("permissionDenied");
				var parser = document.createElement("a"); parser.href = url;
				document.querySelector("#permissionHost").appendChild(document.createTextNode(parser.origin));
			}
		});
	});
}

init();
registerListeners();

function requestPermission(url) {
	chrome.permissions.request({ origins: [url] }, function(granted) {
		if (granted) {
			document.body.classList.remove("permissionDenied");
			init();
		} else {
		}
	  });
}

document.querySelector("#grantHost").addEventListener("click", function(e) { requestPermission(url); });
document.querySelector("#grantAll").addEventListener("click", function(e) { requestPermission("<all_urls>"); });

document.querySelector("#pagetitle").addEventListener("change", function (e) {
	title = document.querySelector("#pagetitle").value;
	pageUtils.setTitle(url, title);
	showData();
});


document.querySelector("#delete").addEventListener("click", function (e) {
	pageUtils.remove(url, function () {
		document.body.classList.remove("unchanged", "changed", "failed", "known", "expanded");
		changes = -1, current = -1;
		known = false;
		showPage(loadedDocument, showData);
	});
});

function expand() {
	if(window.oldcontent !== null) pageUtils.setContent(url, window.oldcontent);
	pageUtils.getOrCreateEffectiveConfig(url, title, config => {
		document.body.classList.remove("unchanged", "changed", "failed");
		document.body.classList.add("expanded", "known");
		changes = -1, current = -1;
		known = true;
		window.config = config;
		showPage(loadedDocument, showData);
		if (config.stripStyles)
			highlightUtils._stripStyles(document.getElementById("iframe").contentWindow.document);
		if (config.isolateRegions) 
			highlightUtils._isolateRegions(document.getElementById("iframe").contentWindow.document, config);
		showOptions();
	});
}

function openPage() {
	window.location.href = url;
}

document.querySelector("#expand").addEventListener("click", expand);

document.querySelector("#open").addEventListener("click", openPage);

document.querySelector("#highlight").addEventListener("click", function (e) {
	document.body.classList.remove("expanded");
	if (changes > 0) {
		var iframe = document.getElementById("iframe");
		var idoc = iframe.contentWindow.document;
		current = highlightUtils.highlightNext(idoc, current);
		showData();
	} else if (changes == 0) {
		showData();
	} else {
		highlight();
	};
});
