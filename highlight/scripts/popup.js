function registerListeners() {
	for (var i = 0; i < options.length; i++) {
		registerListener(options[i]);
	}
}
function registerListener(option) {
	var performUpdate = async (value) => {
		await pageUtils.setConfigProperty(url, option.key, value);
		if (option.post) 
			await Promise.resolve(option.post());
		if (option.type == "text") 
			document.querySelector("#" + option.elem).value = value;
		else if (option.type == "checkbox") 
			document.querySelector("#" + option.elem).checked = value;
	};
	document.querySelector("#" + option.elem).addEventListener("change", async function (e) {
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
		if (option.pre) 
			value = await Promise.resolve(option.pre(value));
		await performUpdate(value);
	});
	if (option.type == "list") {
		document.querySelector("#" + option.addelem).addEventListener("click", async function (e) {
			var value = await Promise.resolve(option.add());
			var newlist = [];
			for (var i = 0; i < option.contents.length; i++) {
				newlist.push(option.contents[i]);
			}
			newlist.push(value);
			if (option.pre) 
				newlist = await Promise.resolve(option.pre(newlist));
			await performUpdate(newlist);
		});
		document.querySelector("#" + option.elem).addEventListener("dblclick", async function (e) {
			if (option.edit) {
				var oldValue = document.querySelector("#" + option.elem).value;
				if (oldValue === "") return;
				var newValue = await Promise.resolve(option.edit(oldValue));
				if (newValue === null || newValue === "") return;
				var newlist = [];
				for (var i = 0; i < option.contents.length; i++) {
					if (option.contents[i] != oldValue)
						newlist.push(option.contents[i]);
					else
						newlist.push(newValue);
				}
				if (option.pre) 
					newlist = await Promise.resolve(option.pre(newlist));
				await performUpdate(newlist);
			}
		});
		document.querySelector("#" + option.delelem).addEventListener("click", async function (e) {
			var value = document.querySelector("#" + option.elem).value, newlist = [];
			for (var i = 0; i < option.contents.length; i++) {
				if (option.contents[i] != value) newlist.push(option.contents[i]);
			}
			if (option.select) 
				await Promise.resolve(option.select(null));
			if (option.pre) 
				newlist = await Promise.resolve(option.pre(newlist));
			await performUpdate(newlist);
		});
	}
}

async function showOptions() {
	var config = await pageUtils.getEffectiveConfig(url);
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
}


async function selectExclude() {
	await tabUtils.selectExclude(tabId, url);
	await fillStatus({ state: STATE.SELECTREGION });
	await new Promise(resolve => setTimeout(resolve, 5000));
}

async function selectInclude() {
	await tabUtils.selectInclude(tabId, url);
	await fillStatus({ state: STATE.SELECTREGION });
	await new Promise(resolve => setTimeout(resolve, 5000));
}

async function showOutline(region, color) {
	if (region) 
		await tabUtils.showOutline(tabId, region, color);
	else 
		await tabUtils.removeOutline(tabId);
}

function addBodyIfEmpty(list) {
	if (list.length == 0) list.push("/html/body[1]");
	if (list.length > 1 && list[0] == "/html/body[1]") list.splice(0, 1);
	return list;
}

function editXpath(xpath) {
	return prompt(chrome.i18n.getMessage("configRegionXpath"), xpath);
}

var options = [
	{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
	{ type: "checkbox", key: "scanImages", elem: "checkimages" },
	{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
	{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
	{ type: "checkbox", key: "makeVisible", elem: "makevisible" },
	{ type: "checkbox", key: "stripStyles", elem: "stripstyles" },
	{ type: "checkbox", key: "isolateRegions", elem: "isolateregions" },
	{ type: "list", key: "includes", elem: "include", addelem: "includeadd", delelem: "includedel", select: xpath => showOutline(xpath, config.includeRegion), add: selectInclude, pre: addBodyIfEmpty, post: showOptions },
	{ type: "list", key: "excludes", elem: "exclude", addelem: "excludeadd", delelem: "excludedel", select: xpath => showOutline(xpath, config.excludeRegion), add: selectExclude, post: showOptions }
];

registerListeners();


document.querySelector("#setup").addEventListener("click", async function (e) {
	await tabUtils.openResource("manage.htm");
	window.close();
});

document.querySelector("#pagetitle").addEventListener("change", async function (e) {
	await pageUtils.setTitle(url, document.querySelector("#pagetitle").value);
	document.body.classList.remove("disabled");
	document.querySelector("#delete").style.visibility = 'visible';
});

document.querySelector("#delete").addEventListener("click", async function (e) {
	await pageUtils.remove(url);
	await tabUtils.showIcon(tabId);
	window.close();
});

document.querySelector("#highlight").addEventListener("click", async function (e) {
	await pageUtils.getOrCreateEffectiveConfig(url, document.querySelector("#pagetitle").value);
	
	document.body.classList.remove("disabled");
	document.body.classList.remove("expanded");
	document.body.classList.add("enabled");
	var status = await tabUtils.highlightChanges(tabId, url);
	await fillStatus(status);
});

document.querySelector("#sidebar").addEventListener("click", function (e) {
	if(chrome && chrome.sidebarAction && chrome.sidebarAction.open) 
		chrome.sidebarAction.open(); 
	else 
		tabUtils.openResource("pages.htm");
	window.close();	
});

async function expand() {
	var pageconfig = await pageUtils.getOrCreateEffectiveConfig(url, document.querySelector("#pagetitle").value);
	document.body.classList.add("expanded");
	document.body.classList.remove("disabled");
	document.body.classList.add("enabled");
	config = pageconfig;
	await showOptions();
}

document.querySelector("#expand").addEventListener("click", function (e) {
	expand();
});

var STATE = {
	LOADED: 1,
	HIGHLIGHTED: 2,
	SELECTREGION: 3
};

function showTitle(title) {
	document.querySelector("#url").value = url;
	document.querySelector("#pagetitle").value = title;
}

function fillStatus(status) {
	document.body.classList.remove("loaded");
	document.body.classList.remove("highlighted");
	document.body.classList.remove("changed");
	document.body.classList.remove("unchanged");
	document.body.classList.remove("selecting");
	if (status === undefined) {
		document.body.classList.add("unavailable");
		return;
	}

	switch (status.state) {
		case STATE.LOADED:
			document.body.classList.add("loaded");
			break;
		case STATE.HIGHLIGHTED:
			document.body.classList.add("highlighted");
			if (status.changes == 0) {
				document.body.classList.add("unchanged");
			} else if (status.changes > 0) {
				document.body.classList.add("changed");
				document.querySelector("#changed").firstChild.data = chrome.i18n.getMessage("pageChanged", [status.current, status.changes]);
			} else {
				document.body.classList.add("failed");
				expand();
			}
			tabUtils.showIcon(tabId, status.current, status.changes);
			pageUtils.setChanges(url, status.changes < 0 ? -1 : 0);
			break;
		case STATE.SELECTREGION:
			document.body.classList.add("selecting");
			break;
	}
}

var tabId = null;
var url = null;
var config = null;

tabUtils.getActive().then(async function (tab) {
	tabId = tab.id; url = tab.url;
	if (url.substr(0, 4) != "http") {
		document.body.classList.add("unavailable");
		return;
	}
	
	if(url == "https://sitedelta.schierla.de/transfer/") {
		await tabUtils._executeScripts(tabId, ["/common/scripts/transferScript.js"]);
		window.close();
		return;
	}

	var title = await pageUtils.getTitle(url);
	if (title === null) {
		showTitle(tab.title);
		document.body.classList.add("disabled");
	} else {
		showTitle(title);
		tabUtils.getStatus(tabId, fillStatus);
		document.body.classList.add("enabled");
	}
});
