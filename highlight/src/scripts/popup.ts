import { Config } from "@sitedelta/common/src/scripts/config";
import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import { i18n } from "@sitedelta/common/src/scripts/uiUtils";
import * as highlightScriptUtils from "./highlightScriptUtils";
import { HighlightState, PageState } from "./highlightState";

function registerListeners() {
	for (var i = 0; i < options.length; i++) {
		registerListener(options[i]);
	}
}

function registerListener(option: CheckboxOption | ListOption) {
	var performUpdate = async (value) => {
		await pageUtils.setConfigProperty(url, option.key as keyof Config, value);
		if (option.post) 
			await Promise.resolve(option.post());
		if (option.type == "checkbox") 
			inputElement(option.elem).checked = value;
	};
	inputElement(option.elem).addEventListener("change", async function (e) {
		var value: any;
		if (option.type == "checkbox") {
			value = inputElement(option.elem).checked;
		} else if (option.type == "list") {
			value = selectElement(option.elem).value;
			for (var i = 0; i < options.length; i++) {
				var otheroption = options[i];
				if (otheroption != option && otheroption.type == "list") {
					element(otheroption.delelem || "").setAttribute("disabled", "disabled");
					selectElement(options[i].elem).value = "";
					var onselect = otheroption.select; 
					if(onselect) onselect(null);
				}
			}
			element(option.delelem).removeAttribute("disabled");
			if (option.select) await Promise.resolve(option.select(value));
			return;
		}
		if (option.pre) 
			value = await Promise.resolve(option.pre(value));
		await performUpdate(value);
	});
	if (option.type == "list") {
		element(option.addelem).addEventListener("click", async function (e) {
			var value = await Promise.resolve(option.add());
			var newlist: string[] = [];
			if(option.contents) for (var i = 0; i < option.contents.length; i++) {
				newlist.push(option.contents[i]);
			}
			newlist.push(value);
			if (option.pre) 
				newlist = await Promise.resolve(option.pre(newlist));
			await performUpdate(newlist);
		});
		element(option.elem).addEventListener("dblclick", async function (e) {
			if (option.edit) {
				var oldValue = selectElement(option.elem).value;
				if (oldValue === "") return;
				var newValue = await Promise.resolve(option.edit(oldValue));
				if (newValue === null || newValue === "") return;
				var newlist : string[] = [];
				if(option.contents) for (var i = 0; i < option.contents.length; i++) {
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
		element(option.delelem).addEventListener("click", async function (e) {
			var value = selectElement(option.elem).value, newlist: string[] = [];
			if(option.contents) for (var i = 0; i < option.contents.length; i++) {
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

async function showOptions(): Promise<void> {
	var config = await pageUtils.getEffectiveConfig(url);
	if(!config) return;
	for (var i = 0; i < options.length; i++) {
		var option = options[i];
		if (option.type == "checkbox")
			inputElement(options[i].elem).checked = config[option.key] as boolean;
		else if (option.type == "list") {
			var list = selectElement(option.elem);
			while (list.firstChild) list.removeChild(list.firstChild);
			var contents = config[option.key] as string[];
			option.contents = contents;
			for (var j = 0; j < contents.length; j++) {
				var item = config[option.key][j];
				var node = document.createElement("option");
				node.setAttribute("value", item);
				node.appendChild(document.createTextNode(item));
				list.appendChild(node);
			}
			element(option.delelem || "").setAttribute("disabled", "disabled");
		}
	}
}


async function selectExclude() {
	var ret = await highlightScriptUtils.selectExclude(tabId, url);
	fillStatus({ state: PageState.SELECTREGION });
	await new Promise(resolve => setTimeout(resolve, 5000));
	return ret;
}

async function selectInclude() {
	var ret = await highlightScriptUtils.selectInclude(tabId, url);
	fillStatus({ state: PageState.SELECTREGION });
	await new Promise(resolve => setTimeout(resolve, 5000));
	return ret;
}

async function showOutline(region: string | null, color: string) {
	if (region) 
		await highlightScriptUtils.showOutline(tabId, region, color);
	else 
		await highlightScriptUtils.removeOutline(tabId);
}

async function addBodyIfEmpty(list: string[]): Promise<string[]> {
	if (list.length == 0) list.push("/html/body[1]");
	if (list.length > 1 && list[0] == "/html/body[1]") list.splice(0, 1);
	return list;
}

function editXpath(xpath) {
	return prompt(chrome.i18n.getMessage("configRegionXpath"), xpath);
}


interface CheckboxOption {
	type: "checkbox", 
	key: keyof Config, 
	elem: string,
	pre?: (data: boolean) => (Promise<boolean> | boolean), 
	post?: () => (Promise<void> | void)
}

interface ListOption {
	type: "list", 
	key: keyof Config, 
	elem: string, 
	addelem: string,
	delelem: string, 
	contents?: string[],
	select: (data: string | null) => (Promise<void> | void), 
	add: () => (Promise<string> | string), 
	edit?: (data: string) => (Promise<string> | string),
	pre?: (data: string[]) => (Promise<string[]> | string[]), 
	post?: () => (Promise<void> | void)
}

var options: (CheckboxOption | ListOption)[] = [
	{ type: "checkbox", key: "checkDeleted", elem: "checkdeleted" },
	{ type: "checkbox", key: "scanImages", elem: "checkimages" },
	{ type: "checkbox", key: "ignoreCase", elem: "ignorecase" },
	{ type: "checkbox", key: "ignoreNumbers", elem: "ignorenumbers" },
	{ type: "checkbox", key: "makeVisible", elem: "makevisible" },
	{ type: "checkbox", key: "stripStyles", elem: "stripstyles" },
	{ type: "checkbox", key: "isolateRegions", elem: "isolateregions" },
	{ type: "list", key: "includes", elem: "include", addelem: "includeadd", delelem: "includedel", select: (xpath: string) => showOutline(xpath, config ? config.includeRegion : "f00"), add: selectInclude, pre: addBodyIfEmpty, post: showOptions },
	{ type: "list", key: "excludes", elem: "exclude", addelem: "excludeadd", delelem: "excludedel", select: (xpath: string) => showOutline(xpath, config ? config.excludeRegion : "f00"), add: selectExclude, post: showOptions }
];

async function expand() {
	var pageconfig = await pageUtils.getOrCreateEffectiveConfig(url, inputElement("pagetitle").value);
	document.body.classList.add("expanded");
	document.body.classList.remove("disabled");
	document.body.classList.add("enabled");
	config = pageconfig;
	await showOptions();
}

function showTitle(title) {
	inputElement("url").value = url;
	inputElement("pagetitle").value = title;
}

function fillStatus(status: HighlightState) {
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
		case PageState.LOADED:
			document.body.classList.add("loaded");
			break;
		case PageState.HIGHLIGHTED:
			document.body.classList.add("highlighted");
			if (status.changes == 0) {
				document.body.classList.add("unchanged");
			} else if (status.changes > 0) {
				document.body.classList.add("changed");
				(element("changed").firstChild as CharacterData).data = chrome.i18n.getMessage("pageChanged", [status.current, status.changes]);
			} else {
				document.body.classList.add("failed");
				expand();
			}
			tabUtils.showIcon(tabId, status.current, status.changes);
			pageUtils.setChanges(url, status.changes < 0 ? -1 : 0);
			break;
		case PageState.SELECTREGION:
			document.body.classList.add("selecting");
			break;
	}
}

var tabId: number = 0;
var url: string = "";
var config: Config | undefined;


function selectElement(id: string)  : HTMLSelectElement {
	return document.querySelector("#"+id) as HTMLSelectElement;
}
function inputElement(id: string)  : HTMLInputElement {
	return document.querySelector("#"+id) as HTMLInputElement;
}
function element(id: string) : HTMLElement {
	return document.querySelector("#"+id) as HTMLElement;
}

async function init() {
	var advancedPermission = { permissions: [], origins: ["<all_urls>"] };
	if (chrome.permissions) {
		chrome.permissions.contains(advancedPermission, (success) => {
			if(success) document.body.classList.add("advancedEnabled");
		});
	}

	// element("setup").addEventListener("click", async function (e) {
	// 	await tabUtils.openResource("manage.htm");
	// 	window.close();
	// });

	element("scanAll").addEventListener("click", e => {
		highlightScriptUtils.scanAll();
	});

	element("pagetitle").addEventListener("change", async function (e) {
		await pageUtils.setTitle(url, inputElement("pagetitle").value);
		document.body.classList.remove("disabled");
		element("delete").style.visibility = 'visible';
	});

	element("delete").addEventListener("click", async function (e) {
		await pageUtils.remove(url);
		await tabUtils.showIcon(tabId);
		window.close();
	});

	element("highlight").addEventListener("click", async function (e) {
		await pageUtils.getOrCreateEffectiveConfig(url, inputElement("pagetitle").value);
		
		document.body.classList.remove("disabled");
		document.body.classList.remove("expanded");
		document.body.classList.add("enabled");
		var status = await highlightScriptUtils.highlightChanges(tabId, url);
		fillStatus(status);
	});

	element("sidebar").addEventListener("click", function (e) {
		if(chrome && (chrome as any).sidebarAction && (chrome as any).sidebarAction.open) 
			(chrome as any).sidebarAction.open(); 
		else 
			tabUtils.openResource("pages.htm");
		window.close();	
	});

	element("expand").addEventListener("click", function (e) {
		expand();
	});

	registerListeners();

	var tab = await tabUtils.getActive();

	tabId = tab.id || 0; 
	url = tab.url || "";
	if (url.substr(0, 4) != "http") {
		document.body.classList.add("unavailable");
		return;
	}
	
	if(url == "https://sitedelta.schierla.de/transfer/") {
		await tabUtils.executeScripts(tabId, "/scripts/transferScript.js");
		window.close();
		return;
	}

	var title = await pageUtils.getTitle(url);
	if (title === null) {
		showTitle(tab.title);
		document.body.classList.add("disabled");
	} else {
		showTitle(title);
		var status = await highlightScriptUtils.getStatus(tabId);
		fillStatus(status);
		document.body.classList.add("enabled");
	}
}

init();
i18n();