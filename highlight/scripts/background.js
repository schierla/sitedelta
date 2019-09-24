
var openTabRequest = {};

var webNavigationBeforeListener = function (details) {
	if (details.frameId != 0) return;
	tabUtils.showIcon(details.tabId);
};

var webNavigationCompletedListener = function (details) {
	if (details.frameId != 0) return;
	if (openTabRequest.tabId !== undefined && openTabRequest.tabId == details.tabId && details.url != "about:blank") {
		openTabRequest.onLoad(details.url);
		openTabRequest = {};
	} else {
		checkPage(details.tabId, details.url);
	}
}

async function checkPage(tabId, url) {
	var defaultConfig = await configUtils.getDefaultConfig();
	if (!defaultConfig.scanOnLoad) return;
	var changes = await tabUtils.checkChanges(tabId, url);
	if (changes == 0) {
		// unchanged
		tabUtils.showIcon(tabId, 0, 0);
		await pageUtils.setChanges(url, 0);
	} else if (changes > 0) {
		// changed
		tabUtils.showIcon(tabId, "*", 1);
		await pageUtils.setChanges(url, 1);

		if (!defaultConfig.highlightOnLoad) return;
		var status = await tabUtils.highlightChanges(tabId, url);
		tabUtils.showIcon(tabId, status.current, status.changes);
		await pageUtils.setChanges(url, status.changes < 0 ? -1 : 0);
	}
};


function menuHighlightPage() {
	return {
		id: "highlightPage",
		title: chrome.i18n.getMessage("pageScan"),
		documentUrlPatterns: ["http://*/*", "https://*/*"],
		contexts: ["page"]
	}
};

function menuHighlight() {
	return {
		id: "highlight",
		title: chrome.i18n.getMessage("pageScan"),
		contexts: ["browser_action"]
	}
};

function menuOptions() {
	return {
		id: "options",
		title: chrome.i18n.getMessage("pagesConfiguration"),
		contexts: ["browser_action"]
	}
};

var contextMenuListener = async function (info, tab) {
	if (info.menuItemId == menuHighlight().id || info.menuItemId == menuHighlightPage().id) {
		if (tab.url.substr(0, 4) != "http") {
			tabUtils.showIcon(tab.id, 0, -1);
			return;
		}
		await pageUtils.getOrCreateEffectiveConfig(tab.url, tab.title);
		var status = await tabUtils.highlightChanges(tab.id, tab.url);
		await tabUtils.showIcon(tab.id, status.current, status.changes);
		await pageUtils.setChanges(tab.url, status.changes < 0 ? -1 : 0);
	} else if (info.menuItemId == menuOptions().id) {
		await tabUtils.openResource("manage.htm");
	}
};

var messageListener = function (request, sender, sendResponse) {
	var hiddenFields = ["configVersion", "autoDelayPercent", "autoDelayMin", "autoDelayMax", "watchDelay", "includes", "excludes"];
	if (request.command == "addIncludeRegion") {
		tabUtils.selectRegion(request.tab).then(xpath => pageUtils.addInclude(request.url, xpath));
	} else if (request.command == "addExcludeRegion") {
		tabUtils.selectRegion(request.tab).then(xpath => pageUtils.addExclude(request.url, xpath));
	} else if (request.command == "reinitialize") {
		initialize();
	} else if (request.command == "loadInTab") {
		chrome.tabs.update(request.tabId, { url: request.url });
		openTabRequest = { url: request.url, tabId: request.tab, onLoad: sendResponse };
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


async function initialize() {
	if (chrome.webNavigation) {
		chrome.webNavigation.onBeforeNavigate.removeListener(webNavigationBeforeListener);
		chrome.webNavigation.onCompleted.removeListener(webNavigationCompletedListener);
		chrome.webNavigation.onBeforeNavigate.addListener(webNavigationBeforeListener);
		chrome.webNavigation.onCompleted.addListener(webNavigationCompletedListener);
	}

	if (chrome.contextMenus) {
		chrome.contextMenus.onClicked.removeListener(contextMenuListener);
		chrome.contextMenus.removeAll();
		var config = await configUtils.getDefaultConfig();
		if (config.enableContextMenu) {
			chrome.contextMenus.create(menuHighlightPage());
			chrome.contextMenus.create(menuHighlight());
			chrome.contextMenus.create(menuOptions());
			chrome.contextMenus.onClicked.addListener(contextMenuListener);
		}
	}

	chrome.runtime.onMessage.removeListener(messageListener);
	chrome.runtime.onMessage.addListener(messageListener);
}

initialize();
