
var webNavigationBeforeListener = function (details) {
	if (details.frameId != 0) return;
	tabUtils.showIcon(details.tabId, "inactive");
	if (chrome.notifications) chrome.notifications.clear("highlight");
};

var webNavigationCompletedListener = function (details) {
	if (details.frameId != 0) return;
	pageUtils.getEffectiveConfig(details.url, function (config) {
		if (config === null) {
			tabUtils.showIcon(details.tabId, "neutral");
		} else {
			pageUtils.getContent(details.url, function (oldcontent) {
				if (oldcontent !== null) {
					tabUtils.getContent(details.tabId, details.url, function (content) {
						if (textUtils.clean(content, config) == textUtils.clean(oldcontent, config)) {
							// unchanged
							tabUtils.showIcon(details.tabId, "unchanged");
						} else {
							// changed
							tabUtils.showIcon(details.tabId, "changed");
							if (config.highlightOnLoad) {
								tabUtils.highlightChanges(details.tabId, details.url);
							}
						}
					});
				}
			});
		}
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
			chrome.notifications.create("highlight", {
				"type": "basic",
				"iconUrl": chrome.extension.getURL("common/icons/inactive.svg"),
				"title": chrome.i18n.getMessage("highlightExtensionName"),
				"message": chrome.i18n.getMessage("highlightUnsupported")
			});
			return;
		}
		pageUtils.getOrCreateEffectiveConfig(tab.url, tab.title, function (config) {
			tabUtils.highlightChanges(tab.id, tab.url, function (status) {
				if (status.changes == 0) {
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("common/icons/unchanged.svg"),
						"title": chrome.i18n.getMessage("highlightExtensionName"),
						"message": chrome.i18n.getMessage("pageUnchanged")
					});
				} else if (status.changes > 0) {
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("common/icons/changed.svg"),
						"title": chrome.i18n.getMessage("highlightExtensionName"),
						"message": chrome.i18n.getMessage("pageChanged", [status.current, status.changes])
					});
				} else {
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("common/icons/inactive.svg"),
						"title": chrome.i18n.getMessage("highlightExtensionName"),
						"message": chrome.i18n.getMessage("pageFailed")
					});
				}
			});
		});
	} else if (info.menuItemId == menuOptions().id) {
		tabUtils.openResource("manage.htm");
	}
};

var messageListener = function (request, sender, sendResponse) {
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
	} else if(request.command == "transferCaps") {
		sendResponse({name: "SiteDelta Highlight", id: "sitedelta-highlight", import: ["config"], export: ["config", "pages"]});
	} else if(request.command == "transferImport") {
		if(request.scope == "config") {
			configUtils.getDefaultConfig(config => {
				var update = {};
				var newConfig = JSON.parse(request.data);
				for(var key in newConfig) {
					if(key in config) {
						update[key] = newConfig[key];
					}
				}
				configUtils.setDefaultConfigProperties(update);
			});
		}
	} else if(request.command == "transferExport") {
		if(request.scope == "config") {
			configUtils.getDefaultConfig(config => {
				var send = {};
				for(var key in config) {
					if(["configVersion","autoDelayPercent","autoDelayMin","autoDelayMax","watchDelay","includes","excludes"].indexOf(key) >= 0) continue;
					send[key] = config[key];
				}
				sendResponse(JSON.stringify(send, null, " "))
			});
			return true;
		} else if(request.scope == "pages") {
			pageUtils.list((urls) => {
				collectPages(urls, [],  pages => {
					sendResponse(JSON.stringify(pages, null, " "));
				});
			});
			return true;
		}
	}
};

function collectPages(urls, pages, callback) {
	if(urls.length == 0) return callback(pages);
	var url = urls.shift();
	pageUtils.getTitle(url, title => {
		pageUtils.getConfig(url, config => {
			var page = {url: url, title: title};
			for(var key in config) {
				page[key] = config[key];
			}
			pages.push(page);
			collectPages(urls, pages, callback);
		});
	});
}

function initialize() {
	configUtils.getDefaultConfig((config) => {
		if (chrome.webNavigation) {
			chrome.webNavigation.onBeforeNavigate.removeListener(webNavigationBeforeListener);
			chrome.webNavigation.onCompleted.removeListener(webNavigationCompletedListener);
			if (config.scanOnLoad) {
				chrome.webNavigation.onBeforeNavigate.addListener(webNavigationBeforeListener);
				chrome.webNavigation.onCompleted.addListener(webNavigationCompletedListener);
			}
		}

		if (chrome.contextMenus) {
			chrome.contextMenus.onClicked.removeListener(contextMenuListener);
			chrome.contextMenus.removeAll();
			if (config.enableContextMenu) {
				chrome.contextMenus.create(menuHighlightPage());
				chrome.contextMenus.create(menuHighlight());
				chrome.contextMenus.create(menuOptions());
				chrome.contextMenus.onClicked.addListener(contextMenuListener);
			}
		}
	});

	chrome.runtime.onMessage.removeListener(messageListener);
	chrome.runtime.onMessage.addListener(messageListener);
}

initialize();
