import * as tabUtils from "@sitedelta/common/src/scripts/tabUtils";
import * as pageUtils from "@sitedelta/common/src/scripts/pageUtils";
import * as configUtils from "@sitedelta/common/src/scripts/configUtils";
import * as ioUtils from "@sitedelta/common/src/scripts/ioUtils";
import * as transferUtils from "@sitedelta/common/src/scripts/transferUtils";
import * as highlightScriptUtils from "./scripts/highlightScriptUtils";
import { PageState } from "./scripts/highlightState";

var openTabRequest: null | {url: string, tabId: number, onLoad?: (url: string) => void} = null;

function handlePageLoad(tabId: number, url: string) {
	if (openTabRequest && openTabRequest.tabId == tabId && url == openTabRequest.url) {
		if(openTabRequest.onLoad) openTabRequest.onLoad(url);
		openTabRequest.onLoad = undefined;
	} else {
		checkPage(tabId, url);
	}
}

function handlePageUnload(tabId: number, url: string) {
	tabUtils.showIcon(tabId);
}

async function checkPage(tabId: number, url: string): Promise<void> {
	var defaultConfig = await configUtils.getDefaultConfig();
	if (!defaultConfig.scanOnLoad) return;
	await new Promise(resolve => setTimeout(resolve, 1000));
	var changes = await highlightScriptUtils.checkChanges(tabId, url);
	if (changes == 0) {
		// unchanged
		tabUtils.showIcon(tabId, 0, 0);
		await pageUtils.setChanges(url, 0);
	} else if (changes > 0) {
		// changed
		tabUtils.showIcon(tabId, "*", 1);
		await pageUtils.setChanges(url, 1);

		if (!defaultConfig.highlightOnLoad) return;
		var status = await highlightScriptUtils.highlightChanges(tabId, url);
		if(status.state != PageState.HIGHLIGHTED) return;
		tabUtils.showIcon(tabId, status.current, status.changes);
		await pageUtils.setChanges(url, status.changes < 0 ? -1 : 0);
	}
};


function menuHighlightPage(): chrome.contextMenus.CreateProperties {
	return {
		id: "highlightPage",
		title: chrome.i18n.getMessage("pageScan"),
		documentUrlPatterns: ["http://*/*", "https://*/*"],
		contexts: ["page"]
	}
};

function menuHighlight(): chrome.contextMenus.CreateProperties {
	return {
		id: "highlight",
		title: chrome.i18n.getMessage("pageScan"),
		contexts: ["browser_action"]
	}
};

function menuOptions(): chrome.contextMenus.CreateProperties {
	return {
		id: "options",
		title: chrome.i18n.getMessage("pagesConfiguration"),
		contexts: ["browser_action"]
	}
};

async function loadInTab(url: string, tabId: number): Promise<void> {
	return new Promise(resolve => {
		openTabRequest = { url: url, tabId: tabId, onLoad: url => resolve() };	
		chrome.tabs.update(tabId, { url: url });
	});
}

async function scanPage(url: string, tabId: number): Promise<void> {
	await loadInTab(url, tabId);
	await new Promise(resolve => setTimeout(resolve, 1000));		
	var changes = await highlightScriptUtils.checkChanges(tabId, url);
	await pageUtils.setChanges(url, changes);
}

function scanPages(pages: string[]): void {
	chrome.tabs.create({ url: "about:blank" }, async tab => {
		for(var i=0; i<pages.length; i++) {
			await scanPage(pages[i], tab.id || 0);
		}
		var changed = await pageUtils.listChanged();
		if(changed.length > 0) {
			chrome.tabs.update(tab.id || 0, { url: chrome.runtime.getURL("pages.htm") });
			return;
		}
		chrome.tabs.remove(tab.id || 0);
	});
}

var contextMenuListener = async function (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) {
	if (tab && tab.url && tab.id && (info.menuItemId == menuHighlight().id || info.menuItemId == menuHighlightPage().id)) {
		if (tab.url.substr(0, 4) != "http") {
			tabUtils.showIcon(tab.id, 0, -1);
			return;
		}
		await pageUtils.getOrCreateEffectiveConfig(tab.url, tab.title || "");
		var status = await highlightScriptUtils.highlightChanges(tab.id, tab.url);
		if(status.state != PageState.HIGHLIGHTED) return;
		await tabUtils.showIcon(tab.id, status.current, status.changes);
		await pageUtils.setChanges(tab.url, status.changes < 0 ? -1 : 0);
	} else if (info.menuItemId == menuOptions().id) {
		await tabUtils.openResource("manage.htm");
	}
};

var messageListener = function (request: any, sender: any, sendResponse: (response: any) => void) {
	var hiddenFields = ["configVersion", "autoDelayPercent", "autoDelayMin", "autoDelayMax", "watchDelay", "includes", "excludes"];
	if(request.command == "notifyLoaded") {
		handlePageLoad(sender.tab.id, sender.url);
	} else if(request.command == "notifyUnloaded") {
		handlePageUnload(sender.tab?.id, sender.url);
	} else if (request.command == "addIncludeRegion") {
		highlightScriptUtils.selectRegion(request.tab).then(xpath => pageUtils.addInclude(request.url, xpath));
	} else if (request.command == "addExcludeRegion") {
		highlightScriptUtils.selectRegion(request.tab).then(xpath => pageUtils.addExclude(request.url, xpath));
	} else if (request.command == "reinitialize") {
		reinitialize();
	} else if (request.command == "scanAll") {
		pageUtils.list().then(scanPages);
	} else if (request.command == "scan") {
		scanPage(request.url, request.tabId).then(sendResponse);
		return true;
	} else if (request.command == "transferInfo") {
		sendResponse({ name: "SiteDelta Highlight", id: "sitedelta-highlight", import: ["config", "pages"], export: ["config", "pages"] });
	} else if (request.command == "transferImport") {
		if (request.scope == "config") {
			try {
				var config = JSON.parse(request.data);
				transferUtils.importConfig(config, hiddenFields).then(result =>
					sendResponse("Configuration import completed: \n" + result.imported + " imported, " + result.skipped + " skipped")
				);
			} catch (e) {
				sendResponse("Configuration import failed: \n" + e);
			}
		} else if (request.scope == "pages") {
			try {
				var pages = JSON.parse(request.data);
				transferUtils.importPages(pages).then(result => 
					sendResponse("Page import completed: \n" + result.imported + " imported, " + result.skipped + " skipped")
				);
			} catch (e) {
				sendResponse("Page import failed: \n" + e);
			}
		}
		return true;
	} else if (request.command == "transferExport") {
		if (request.scope == "config") {
			transferUtils.exportConfig(hiddenFields).then(config => 
				sendResponse(JSON.stringify(config, null, "  "))
			);
		} else if (request.scope == "pages") {
			transferUtils.exportPages().then(pages => 
				sendResponse(JSON.stringify(pages, null, "  "))
			);
		}
		return true;
	}
};


function cleanupContextMenu() {
	chrome.contextMenus.onClicked.removeListener(contextMenuListener);
	chrome.contextMenus.removeAll();
}

function fillContextMenu() {
	chrome.contextMenus.create(menuHighlightPage());
	chrome.contextMenus.create(menuHighlight());
	chrome.contextMenus.create(menuOptions());
	chrome.contextMenus.onClicked.addListener(contextMenuListener);
}

async function initialize(): Promise<void> {
	chrome.runtime.onMessage.addListener(messageListener);
	tabUtils.initContentScriptTargets([]);
	ioUtils.observeIndex(index => tabUtils.updateContentScriptTarget(Object.keys(index)));
	await reinitialize();
}

async function reinitialize(): Promise<void> {
	tabUtils.updateContentScriptTarget(Object.keys(await ioUtils.listIndex()));
	if (chrome.contextMenus) {
		cleanupContextMenu();
		if ((await configUtils.getDefaultConfig()).enableContextMenu) 
			fillContextMenu();
	}
}

initialize();
