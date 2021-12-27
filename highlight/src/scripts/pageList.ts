import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as uiUtils from "@sitedelta/common/src/scripts/uiUtils";
import { i18n } from "@sitedelta/common/src/scripts/uiUtils";
import * as highlightScriptUtils from "./highlightScriptUtils";

async function deletePage(key: string, data: any) {
	await ioUtils.remove(key);
}

async function openPage(key: string, data: any) {
	chrome.tabs.create({ url: key }); 
	await new Promise(resolve => setTimeout(resolve, 300));
}

async function openPageInBackground(key: string, data: any) {
	chrome.tabs.create({ url: key, active: false }); 
	await new Promise(resolve => setTimeout(resolve, 300));
}

async function scanPage(key: string, tabId: number) {
	await highlightScriptUtils.scan(key, tabId);
}

function selectAllIfNone(): void {
	var options = (document.querySelector("#pages") as HTMLSelectElement).options;
	for(var i = 0; i < options.length; i++)
		if(options[i].selected) return;
	for(var i = 0; i < options.length; i++)
		options[i].selected = true;
}

function selectChangedIfNone(): void {
	var options = (document.querySelector("#pages") as HTMLSelectElement).options;
	for (var i = 0; i < options.length; i++)
		if (options[i].selected) return;
	for (var i = 0; i < options.length; i++)
		if(options[i].classList.contains("changed")) 
			options[i].selected = true;
}

function createItem(key: string, data: any) {
	var title = data.title || key;
	if (!("title" in data)) pageUtils.getTitle(key);
	var ret = document.createElement("option");
	ret.setAttribute("value", key);
	ret.setAttribute("title", key);
	ret.appendChild(document.createTextNode(title));
	return ret;
}

function updateItem(element: HTMLOptionElement, data: any): void {
	(element.firstChild as CharacterData).data = data["title"];
	element.classList.remove("changed", "unchanged", "failed", "scanning");
	if (data.changes === undefined) {
	} else if (data.changes > 0) {
		element.classList.add("changed");
	} else if (data.changes == 0) {
		element.classList.add("unchanged");
	} else if (data.changes == -1) {
		element.classList.add("failed");
	}
}

export async function loadPageList(): Promise<void> {
	var list = new uiUtils.SortedList("pages", createItem, updateItem);
	list.isBefore = (keya: string, a: any, keyb: string, b: any) => a.title!==undefined && b.title!==undefined && a.title.toLowerCase() < b.title.toLowerCase();

	var filter = document.querySelector("#filter") as HTMLInputElement;
	if(filter) {
		list.isShown = (key: string, data: any) => key.indexOf(filter.value) != -1 || (data.title!==undefined && data.title.indexOf(filter.value) != -1);
		filter.addEventListener("input", () => list.refresh());
	}

	(document.querySelector("#delete") as HTMLElement).addEventListener("click", () => list.foreachSelected(deletePage));
	(document.querySelector("#open") as HTMLElement).addEventListener("click", () => { selectChangedIfNone(); list.foreachSelected(openPage, openPageInBackground) });
	(document.querySelector("#scannow") as HTMLElement).addEventListener("click",
		() => chrome.tabs.create({ url: "about:blank" }, async tab => {
			selectAllIfNone();
			await list.foreachSelected((key, data) => scanPage(key, tab.id || 0));
			await new Promise(resolve => setTimeout(resolve, 100));
			chrome.tabs.remove(tab.id || 0);
		}));
	(document.querySelector("#pages") as HTMLElement).addEventListener("dblclick", () => list.foreachSelected(openPage));
	ioUtils.observeIndex(index => list.updateAll(index));
}

i18n();