document.querySelector("#importExport").addEventListener("click", function (e) {
	chrome.tabs.create({ url: "https://sitedelta.schierla.de/transfer/" }); 
});

var options = [
	{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
	{ type: "checkbox", key: "scanImages", elem: "checkimages" },
	{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
	{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
	{ type: "checkbox", key: "makeVisible", elem: "makevisible" },
	{ type: "checkbox", key: "stripStyles", elem: "stripstyles" },
	{ type: "checkbox", key: "isolateRegions", elem: "isolateregions" },
	{ type: "checkbox", key: "showRegions", elem: "showregions" },
	{ type: "checkbox", key: "notifyChanged", elem: "notifychanged" },
	{ type: "checkbox", key: "notifyFailed", elem: "notifyfailed" },
	{ type: "color", key: "addBackground", elem: "addbackground", post: updatePreview },
	{ type: "color", key: "addBorder", elem: "addborder", post: updatePreview },
	{ type: "color", key: "removeBackground", elem: "removebackground", post: updatePreview },
	{ type: "color", key: "removeBorder", elem: "removeborder", post: updatePreview },
	{ type: "color", key: "includeRegion", elem: "includeborder", post: updatePreview },
	{ type: "color", key: "excludeRegion", elem: "excludeborder", post: updatePreview },
	{ type: "text", key: "watchDelay", elem: "watchDelay", pre: value => parseInt(value) }
];

function registerListeners() {
	for (var i = 0; i < options.length; i++) {
		registerListener(options[i]);
	}
}

function registerListener(option) {
	document.querySelector("#" + option.elem).addEventListener("change", async function (e) {
		var value = "";
		if (option.type == "text" || option.type == "color")
			value = document.querySelector("#" + option.elem).value;
		else if (option.type == "checkbox")
			value = document.querySelector("#" + option.elem).checked;
		if (option.pre) 
			value = await Promise.resolve(option.pre(value));
		var update = {}; update[option.key] = value;
		await configUtils.setDefaultConfigProperties(update);
		if (option.post) 
			await Promise.resolve(option.post());
	});
}
function hexColor(color) {
	if (color.length == 4) return color[0] + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]; else return color;
}
async function showOptions() {
	var config = await configUtils.getDefaultConfig();
	for (var i = 0; i < options.length; i++) {
		if (options[i].type == "text")
			document.querySelector("#" + options[i].elem).value = config[options[i].key];
		else if (options[i].type == "color")
			document.querySelector("#" + options[i].elem).value = hexColor(config[options[i].key]);
		else if (options[i].type == "checkbox")
			document.querySelector("#" + options[i].elem).checked = config[options[i].key];
	}
	updatePreview();
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
}


load();