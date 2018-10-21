var advancedEnabled = false;
var advancedPermission = { permissions: ["webNavigation"], origins: ["<all_urls>"] };

function checkPermissions() {
	document.body.classList.remove("advancedEnabled");
	document.body.classList.remove("advancedUnsupported");
	if (chrome.permissions) {
		chrome.permissions.contains(advancedPermission, (success) => {
			advancedEnabled = success;
			if(success) document.body.classList.add("advancedEnabled");
		});
	} else {
		document.body.classList.add("advancedUnsupported");
	}
}

function requestPermission() {
	try {
		chrome.permissions.request(advancedPermission, (success) => {
			checkPermissions();
			notifyChanged();
		});
	} catch (e) {
		checkPermissions();
	}
}

document.querySelector("#enableAdvanced").addEventListener("click", function (e) {
	requestPermission();
});

document.querySelector("#importExport").addEventListener("click", function (e) {
	chrome.tabs.create({ url: "https://sitedelta.schierla.de/transfer/" }); 
});

function checkScanOnLoad(selected, callback) {
	return (callback !== undefined) ? callback(selected & advancedEnabled) : null;
}

function checkHighlightOnLoad(selected, callback) {
	return (callback !== undefined) ? callback(selected & document.querySelector("#scanonload").checked) : null;
}

var options = [
	{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
	{ type: "checkbox", key: "scanImages", elem: "checkimages" },
	{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
	{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
	{ type: "checkbox", key: "stripStyles", elem: "stripstyles" },
	{ type: "checkbox", key: "isolateRegions", elem: "isolateregions" },
	{ type: "checkbox", key: "showRegions", elem: "showregions" },
	{ type: "checkbox", key: "scanOnLoad", elem: "scanonload", pre: checkScanOnLoad, post: notifyChanged },
	{ type: "checkbox", key: "highlightOnLoad", elem: "highlightonload", pre: checkHighlightOnLoad, post: notifyChanged },
	{ type: "checkbox", key: "enableContextMenu", elem: "contextmenu", post: notifyChanged },
	{ type: "color", key: "addBackground", elem: "addbackground", post: updatePreview },
	{ type: "color", key: "addBorder", elem: "addborder", post: updatePreview },
	{ type: "color", key: "removeBackground", elem: "removebackground", post: updatePreview },
	{ type: "color", key: "removeBorder", elem: "removeborder", post: updatePreview },
	{ type: "color", key: "moveBackground", elem: "movebackground", post: updatePreview },
	{ type: "color", key: "moveBorder", elem: "moveborder", post: updatePreview },
	{ type: "color", key: "includeRegion", elem: "includeborder", post: updatePreview },
	{ type: "color", key: "excludeRegion", elem: "excludeborder", post: updatePreview }
];

function registerListeners() {
	for (var i = 0; i < options.length; i++) {
		registerListener(options[i]);
	}
}
function registerListener(option) {
	document.querySelector("#" + option.elem).addEventListener("change", function (e) {
		var value = "";
		if (option.type == "text" || option.type == 'color')
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

	var scanonload = document.querySelector("#scanonload");
	var highlightonload = document.querySelector("#highlightonload");
	if (!scanonload.checked) highlightonload.checked = false;
}


function load() {
	checkPermissions();
	registerListeners();
	showOptions();
}

function notifyChanged() {
	showOptions();
	chrome.runtime.sendMessage({ command: "reinitialize" });
}

load();
