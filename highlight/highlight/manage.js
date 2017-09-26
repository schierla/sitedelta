
document.querySelector("#delete").addEventListener("click", function (e) {
	if (document.querySelector("#pages").value != "") {
		ioUtils.remove(document.querySelector("#pages").value, load);
	}
});

document.querySelector("#open").addEventListener("click", function (e) {
	if (document.querySelector("#pages").value != "") {
		chrome.tabs.create({ url: document.querySelector("#pages").value });
	}
});

document.querySelector("#pages").addEventListener("dblclick", function (e) {
	if (document.querySelector("#pages").value != "") {
		chrome.tabs.create({ url: document.querySelector("#pages").value });
	}
});

document.querySelector("#importConfig").addEventListener("click", function (e) {
	requirePermission("scanonload", (success) => {
		if (!success) return;
		chrome.runtime.sendMessage("sitedelta@schierla.de", "getSettings", (config) => {
			if (!config && chrome.runtime.lastError) {
				console.warn(chrome.runtime.lastError);
			}
			configUtils.getDefaultConfig((defaultConfig) => {
				var update = {};
				for (var key in config) {
					if (key in defaultConfig)
						update[key] = config[key];
				}
				configUtils.setDefaultConfigProperties(update, notifyChanged);
			});
		});
	});
});

document.querySelector("#importPages").addEventListener("click", function (e) {
	chrome.runtime.sendMessage("sitedelta@schierla.de", "getPages", (pages) => {
		if (!pages && chrome.runtime.lastError) {
			console.warn(chrome.runtime.lastError);
		}
		importPages(pages);
	});
});

function importPages(pages) {
	if (pages.length == 0) {
		showPages();
	} else {
		var page = pages.shift();
		pageUtils.getConfig(page.url, (config) => {
			if(config != null) return importPages(pages);
			pageUtils.create(page.url, page.name, () => {
				var settings = { "includes": page.includes, "excludes": page.excludes };
				if (page.checkDeleted != null) settings["checkDeleted"] = page.checkDeleted;
				if (page.scanImages != null) settings["scanImages"] = page.scanImages;
				if (page.ignoreCase != null) settings["ignoreCase"] = page.ignoreCase;
				if (page.ignoreNumbers != null) settings["ignoreNumbers"] = page.ignoreNumbers;

				pageUtils.setConfig(page.url, settings, () => {
					pageUtils.setContent(page.url, page.content, () => { importPages(pages); });
				})
			});
		});
	}
}
// 24ef0168-039c-49c2-94bb-afd2a4a852fb
chrome.runtime.sendMessage("sitedelta@schierla.de", "getVersion", (version) => {
	if (chrome.runtime.lastError) {
		// SiteDelta not available, don't offer to import
		console.log(chrome.runtime.lastError);
	} else if (version == "0.14.0") {
		document.body.classList.add("canimport");
	} else {
		console.log("Unsupported SiteDelta Version " + version);
	}
});

function checkPermission(name) {
	if(chrome.permissions) {
		chrome.permissions.contains(permissions[name], (success) => {
			if (success) delete permissions[name];
		});
	}
}
function checkPermissions() {
	for (var name in permissions) {
		checkPermission(name);
	}
}

function requirePermission(name, callback) {
	if (name in permissions) {
		try {
			chrome.permissions.request(permissions[name], (success) => {
				if (success) delete (permissions[name]);
				callback(success);
			});
		} catch (e) {
			callback(false);
		}
	} else {
		callback(true);
	}
}

var permissions = {
	"scanonload": { permissions: ["webNavigation"], origins: ["<all_urls>"] },
	"contextmenu": { permissions: ["contextMenus", "notifications"] }
};

function checkScanOnLoad(selected, callback) {
	requirePermission("scanonload", (success) => {
		callback(selected & success);
	});
}
function checkHighlightOnLoad(selected, callback) {
	callback(selected & document.querySelector("#scanonload").checked);
}

function checkContextMenu(selected, callback) {
	requirePermission("contextmenu", (success) => {
		callback(selected & success);
	});
};

var options = [
	{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
	{ type: "checkbox", key: "scanImages", elem: "checkimages" },
	{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
	{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
	{ type: "checkbox", key: "showRegions", elem: "showregions" },
	{ type: "checkbox", key: "scanOnLoad", elem: "scanonload", pre: checkScanOnLoad, post: notifyChanged },
	{ type: "checkbox", key: "highlightOnLoad", elem: "highlightonload", pre: checkHighlightOnLoad, post: notifyChanged },
	{ type: "checkbox", key: "enableContextMenu", elem: "contextmenu", pre: checkContextMenu, post: notifyChanged },
	{ type: "text", key: "addBackground", elem: "addbackground", post: updatePreview },
	{ type: "text", key: "addBorder", elem: "addborder", post: updatePreview },
	{ type: "text", key: "removeBackground", elem: "removebackground", post: updatePreview },
	{ type: "text", key: "removeBorder", elem: "removeborder", post: updatePreview },
	{ type: "text", key: "moveBackground", elem: "movebackground", post: updatePreview },
	{ type: "text", key: "moveBorder", elem: "moveborder", post: updatePreview },
	{ type: "text", key: "includeRegion", elem: "includeborder", post: updatePreview },
	{ type: "text", key: "excludeRegion", elem: "excludeborder", post: updatePreview }
];

function registerListeners() {
	for (var i = 0; i < options.length; i++) {
		registerListener(options[i]);
	}
}
function registerListener(option) {
	document.querySelector("#" + option.elem).addEventListener("change", function (e) {
		var value = "";
		if (option.type == "text")
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
function showOptions() {
	configUtils.getDefaultConfig((config) => {
		for (var i = 0; i < options.length; i++) {
			if (options[i].type == "text")
				document.querySelector("#" + options[i].elem).value = config[options[i].key];
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

	var scanonload = document.querySelector("#scanonload");
	var highlightonload = document.querySelector("#highlightonload");
	if (!scanonload.checked) highlightonload.checked = false;
}


function load() {
	checkPermissions();
	registerListeners();
	showOptions();
	showPages();
}

function showPage(url) {
	ioUtils.get(url, "title", function (title) {
		var item = document.createElement("option");
		item.setAttribute("value", url);
		item.setAttribute("title", url);
		item.appendChild(document.createTextNode(title));
		pages.appendChild(item);
	});
}

function showPages() {
	ioUtils.listIndex(function (index) {
		var pages = document.querySelector("#pages");
		while (pages.firstChild) pages.removeChild(pages.firstChild);
		for (var url in index) {
			if (url == null) continue;
			showPage(url);
		}
	});
}

function notifyChanged() {
	showOptions();
	chrome.runtime.sendMessage({ command: "reinitialize" }, function () { });
}

uiUtils.i18n();
load();
