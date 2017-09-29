uiUtils.i18n();

function showPages() {
	pageUtils.list(pages => {
		var list = document.querySelector("#pages");
		while (list.firstChild) list.removeChild(list.firstChild);

		for (var i = 0; i < pages.length; i++) {
			var url = pages[i];
			addPage(url);
		}
	});
};

function addPage(url) {
	pageUtils.getTitle(url, title => {
		pageUtils.getChanges(url, changes => {
			pageUtils.getNextScan(url, nextScan => {
				var list = document.querySelector("#pages");
				var item = document.createElement("option");
				item.setAttribute("value", url);
				if (changes > 0) {
					item.classList.add("changed");
					item.setAttribute("title", url);
				} else {
					item.classList.add("unchanged");
					item.setAttribute("title", url + "\n" + chrome.i18n.getMessage("watchNextScan", new Date(nextScan).toLocaleString()));
				}
				item.appendChild(document.createTextNode(title));
				list.appendChild(item);
			})
		})
	});
}

function deleteSelected() {
	var options = document.querySelector("#pages").options;
	for(var i=0; i<options.length; i++) {
		if(options[i].selected) {
			options[i].selected = false;
			ioUtils.remove(options[i].value, deleteSelected);
			return;
		}
	}
	load();
}

function openSelected() {
	var options = document.querySelector("#pages").options;
	for(var i=0; i<options.length; i++) {
		if(options[i].selected) {
			options[i].selected = false;
			tabUtils.openResource("watch/show.htm?" + options[i].value);
		}
	}
}

document.querySelector("#delete").addEventListener("click", deleteSelected);

document.querySelector("#open").addEventListener("click", openSelected);

document.querySelector("#pages").addEventListener("dblclick", openSelected);


document.querySelector("#importConfig").addEventListener("click", function (e) {
	chrome.runtime.sendMessage("sitedelta@schierla.de", "getSettings", (config) => {
		if (config === null) {
			console.warn("Error importing configuration: " + chrome.runtime.lastError);
		}
		configUtils.getDefaultConfig((defaultConfig) => {
			var update = {};
			config["watchDelay"] = config["watchScanDelay"];
			if(config["watchDelay"] == 0) delete config["watchDelay"];
			for (var key in config) {
				if (key in defaultConfig) update[key] = config[key];
			}
			configUtils.setDefaultConfigProperties(update, showOptions);
		});
	});
});

document.querySelector("#importPages").addEventListener("click", function (e) {
	chrome.runtime.sendMessage("sitedelta@schierla.de", "getPages", (pages) => {
		if (pages === null) {
			console.warn("Error importing pages: " + chrome.runtime.lastError);
		}
		importPages(pages, Date.now() + 30000);
	});
});

function importPages(pages, time) {
	if (pages.length == 0) {
		showPages();
	} else {
		var page = pages.shift();
		if(page.watchDelay == 0) page["watchDelay"] = null;
		else if(page.watchDelay == -1) page.watchDelay = 0;
		
		pageUtils.getConfig(page.url, (config) => {
			if(config !== null) return importPages(pages, time);
			pageUtils.create(page.url, page.name, () => {
				var settings = { "includes": page.includes, "excludes": page.excludes };
				if (page.checkDeleted !== null) settings["checkDeleted"] = page.checkDeleted;
				if (page.scanImages !== null) settings["scanImages"] = page.scanImages;
				if (page.ignoreCase !== null) settings["ignoreCase"] = page.ignoreCase;
				if (page.ignoreNumbers !== null) settings["ignoreNumbers"] = page.ignoreNumbers;
				if (page.watchDelay !== null) settings["watchDelay"] = page.watchDelay;
	
				pageUtils.setConfig(page.url, settings, () => {
					pageUtils.setContent(page.url, page.content, () => { 
						pageUtils.setNextScan(page.url, time, () => {
							watchUtils.updateAlarm(page.url);
							importPages(pages, time + 10000); 
						});	
					});
				})
			});
		});
	}
}

chrome.runtime.sendMessage("sitedelta@schierla.de", "getVersion", (version) => {
	if (version === undefined) {
		console.log("SiteDelta not found, not offering import: " + chrome.runtime.lastError);
	} else if (version == "0.14.0") {
		document.body.classList.add("canimport");
	} else {
		console.log("Unsupported SiteDelta Version " + version);
	}
});




var options = [
	{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
	{ type: "checkbox", key: "scanImages", elem: "checkimages" },
	{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
	{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
	{ type: "checkbox", key: "showRegions", elem: "showregions" },
	{ type: "color", key: "addBackground", elem: "addbackground", post: updatePreview },
	{ type: "color", key: "addBorder", elem: "addborder", post: updatePreview },
	{ type: "color", key: "removeBackground", elem: "removebackground", post: updatePreview },
	{ type: "color", key: "removeBorder", elem: "removeborder", post: updatePreview },
	{ type: "color", key: "moveBackground", elem: "movebackground", post: updatePreview },
	{ type: "color", key: "moveBorder", elem: "moveborder", post: updatePreview },
	{ type: "color", key: "includeRegion", elem: "includeborder", post: updatePreview },
	{ type: "color", key: "excludeRegion", elem: "excludeborder", post: updatePreview },
	{ type: "text", key: "watchDelay", elem: "watchDelay", pre: (value, callback) => callback(parseInt(value)) }
];

function registerListeners() {
	for (var i = 0; i < options.length; i++) {
		registerListener(options[i]);
	}
}

function registerListener(option) {
	document.querySelector("#" + option.elem).addEventListener("change", function (e) {
		var value = "";
		if (option.type == "text" || option.type == "color")
			value = document.querySelector("#" + option.elem).value;
		else if (option.type == "checkbox")
			value = document.querySelector("#" + option.elem).checked;
		var performUpdate = (value) => {
			var update = {}; update[option.key] = value;
			configUtils.setDefaultConfigProperties(update, () => {
				if (option.post) option.post();
			});
		};
		if (option.pre) option.pre(value, performUpdate); else performUpdate(value);
	});
}
function hexColor(color) {
	if (color.length == 4) return color[0] + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]; else return color;
}
function showOptions() {
	configUtils.getDefaultConfig((config) => {
		for (var i = 0; i < options.length; i++) {
			if (options[i].type == "text")
				document.querySelector("#" + options[i].elem).value = config[options[i].key];
			else if (options[i].type == "color")
				document.querySelector("#" + options[i].elem).value = hexColor(config[options[i].key]);
			else if (options[i].type == "checkbox")
				document.querySelector("#" + options[i].elem).checked = config[options[i].key];
		}
		updatePreview();
	});
}

function updatePreview() {
	var addpreview = document.querySelector("#addpreview");
	addpreview.style.border = "dotted black 1px";
	addpreview.style.background = document.querySelector("#addbackground").value;
	addpreview.style.borderColor = document.querySelector("#addborder").value;
	var removepreview = document.querySelector("#removepreview");
	removepreview.style.border = "dotted black 1px";
	removepreview.style.background = document.querySelector("#removebackground").value;
	removepreview.style.borderColor = document.querySelector("#removeborder").value;
	var movepreview = document.querySelector("#movepreview");
	movepreview.style.border = "dotted black 1px";
	movepreview.style.background = document.querySelector("#movebackground").value;
	movepreview.style.borderColor = document.querySelector("#moveborder").value;
	var includepreview = document.querySelector("#includepreview");
	includepreview.style.border = "dotted white 2px";
	includepreview.style.borderColor = document.querySelector("#includeborder").value;
	var excludepreview = document.querySelector("#excludepreview");
	excludepreview.style.border = "dotted white 2px";
	excludepreview.style.borderColor = document.querySelector("#excludeborder").value;
}

function load() {
	registerListeners();
	showOptions();
	showPages();
}


load();