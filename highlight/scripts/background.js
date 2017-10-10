
var openTabRequest = {};

var webNavigationBeforeListener = function (details) {
	if (details.frameId != 0) return;
	tabUtils.showIcon(details.tabId);
};

var webNavigationCompletedListener = function (details) {
	if (details.frameId != 0) return;
	if (openTabRequest.tabId !== undefined && openTabRequest.tabId == details.tabId && details.url != "about:blank") {
		openTabRequest.callback(details.url);
		openTabRequest = {};
	}
	configUtils.getDefaultConfig((defaultConfig) => {
		if (!defaultConfig.scanOnLoad) return;

		pageUtils.getEffectiveConfig(details.url, function (config) {
			if (config !== null) {
				pageUtils.getContent(details.url, function (oldcontent) {
					if (oldcontent !== null) {
						tabUtils.getContent(details.tabId, details.url, function (content) {
							if (textUtils.clean(content, config) == textUtils.clean(oldcontent, config)) {
								// unchanged
								tabUtils.showIcon(details.tabId, 0, 0);
								pageUtils.setChanges(details.url, 0);
							} else {
								// changed
								tabUtils.showIcon(details.tabId, "*", 1);
								pageUtils.setChanges(details.url, 1);
								if (defaultConfig.highlightOnLoad) {
									tabUtils.highlightChanges(details.tabId, details.url, status => {
										tabUtils.showIcon(details.tabId, status.current, status.changes);
										pageUtils.setChanges(details.url, status.changes < 0 ? -1 : 0);
									});
								}
							}
						});
					}
				});
			}
		});
	});
};


function menuHighlightPage() {
	return {
		id: "highlightPage",
		title: chrome.i18n.getMessage("pageHighlight"),
		documentUrlPatterns: ["http://*/*", "https://*/*"],
		contexts: ["page"]
	}
};

function menuHighlight() {
	return {
		id: "highlight",
		title: chrome.i18n.getMessage("pageHighlight"),
		contexts: ["browser_action"]
	}
};

function menuOptions() {
	return {
		id: "options",
		title: chrome.i18n.getMessage("highlightButtonOptions"),
		contexts: ["browser_action"]
	}
};

var contextMenuListener = function (info, tab) {
	if (info.menuItemId == menuHighlight().id || info.menuItemId == menuHighlightPage().id) {
		if (tab.url.substr(0, 4) != "http") {
			tabUtils.showIcon(tab.id, 0, -1);
			return;
		}
		pageUtils.getOrCreateEffectiveConfig(tab.url, tab.title, function (config) {
			tabUtils.highlightChanges(tab.id, tab.url, function (status) {
				tabUtils.showIcon(tab.id, status.current, status.changes);
				pageUtils.setChanges(tab.url, status.changes < 0 ? -1 : 0);
			});
		});
	} else if (info.menuItemId == menuOptions().id) {
		tabUtils.openResource("manage.htm");
	}
};

var messageListener = function (request, sender, sendResponse) {
	var hiddenFields = ["configVersion", "autoDelayPercent", "autoDelayMin", "autoDelayMax", "watchDelay", "includes", "excludes"];
	if (request.command == "addIncludeRegion") {
		tabUtils.selectRegion(request.tab, function (xpath) {
			pageUtils.addInclude(request.url, xpath);
		});
	} else if (request.command == "addExcludeRegion") {
		tabUtils.selectRegion(request.tab, function (xpath) {
			pageUtils.addExclude(request.url, xpath);
		});
	} else if (request.command == "reinitialize") {
		initialize();
	} else if (request.command == "loadInTab") {
		chrome.tabs.update(request.tabId, { url: request.url });
		openTabRequest = { url: request.url, tabId: request.tab, callback: sendResponse };
		return true;
	} else if (request.command == "transferInfo") {
		sendResponse({ name: "SiteDelta Highlight", id: "sitedelta-highlight", import: ["config", "pages"], export: ["config", "pages"] });
	} else if (request.command == "transferImport") {
		if (request.scope == "config") {
			try {
				var config = JSON.parse(request.data);
				transferUtils.importConfig(config, hiddenFields, (imported, skipped) => {
					sendResponse("Configuration import completed: \n" + imported + " imported, " + skipped + " skipped")
				});
			} catch (e) {
				sendResponse("Configuration import failed: \n" + e);
			}
		} else if (request.scope == "pages") {
			try {
				var pages = JSON.parse(request.data);
				transferUtils.importPages(pages, (imported, skipped) => {
					sendResponse("Page import completed: \n" + imported + " imported, " + skipped + " skipped")
				});
			} catch (e) {
				sendResponse("Page import failed: \n" + e);
			}
		}
		return true;
	} else if (request.command == "transferExport") {
		if (request.scope == "config") {
			transferUtils.exportConfig(hiddenFields, config => {
				sendResponse(JSON.stringify(config, null, "  "))
			});
		} else if (request.scope == "pages") {
			transferUtils.exportPages(pages => {
				sendResponse(JSON.stringify(pages, null, "  "));
			});
		}
		return true;
	}
};


function initialize() {
	if (chrome.webNavigation) {
		chrome.webNavigation.onBeforeNavigate.removeListener(webNavigationBeforeListener);
		chrome.webNavigation.onCompleted.removeListener(webNavigationCompletedListener);
		chrome.webNavigation.onBeforeNavigate.addListener(webNavigationBeforeListener);
		chrome.webNavigation.onCompleted.addListener(webNavigationCompletedListener);
	}

	if (chrome.contextMenus) {
		chrome.contextMenus.onClicked.removeListener(contextMenuListener);
		chrome.contextMenus.removeAll();
		configUtils.getDefaultConfig((config) => {
			if (config.enableContextMenu) {
				chrome.contextMenus.create(menuHighlightPage());
				chrome.contextMenus.create(menuHighlight());
				chrome.contextMenus.create(menuOptions());
				chrome.contextMenus.onClicked.addListener(contextMenuListener);
			}
		});
	}

	chrome.runtime.onMessage.removeListener(messageListener);
	chrome.runtime.onMessage.addListener(messageListener);
}

initialize();
