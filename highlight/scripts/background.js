
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

function importConfig(config, hiddenFields, callback) {
	configUtils.getDefaultConfig(oldConfig => {
		var update = {};
		var imported = 0, skipped = 0;
		for (var key in config) {
			if (hiddenFields.indexOf(key) >= 0) continue;
			if (key in oldConfig) {
				if (oldConfig[key] == config[key]) {
					skipped++;
				} else {
					oldConfig[key] = config[key];
					imported++;
				}
			}
		}
		configUtils.setDefaultConfigProperties(update, () => callback(imported, skipped));
	});
}

function importPages(pages, imported, skipped, callback) {
	if (pages.length == 0) {
		return (callback !== undefined) ? callback(imported, skipped) : null;
	} else {
		var page = pages.shift();
		pageUtils.getConfig(page.url, (config) => {
			if (config !== null) return importPages(pages, imported, skipped + 1, callback);
			pageUtils.create(page.url, page.title, () => {
				var settings = { "includes": page.includes, "excludes": page.excludes };
				if (page.includes !== undefined) settings["incudes"] = page.includes;
				if (page.excludes !== undefined) settings["excludes"] = page.excludes;
				if (page.checkDeleted !== undefined) settings["checkDeleted"] = page.checkDeleted;
				if (page.scanImages !== undefined) settings["scanImages"] = page.scanImages;
				if (page.ignoreCase !== undefined) settings["ignoreCase"] = page.ignoreCase;
				if (page.ignoreNumbers !== undefined) settings["ignoreNumbers"] = page.ignoreNumbers;
				if (page.watchDelay !== undefined) settings["watchDelay"] = page.watchDelay;

				pageUtils.setConfig(page.url, settings, () => {
					pageUtils.setContent(page.url, page.content, () => {
						pageUtils.setChanges(page.url, -1, () => {
							importPages(pages, imported + 1, skipped, callback);
						});
					});
				})
			});
		});
	}
}

function exportConfig(hiddenFields, callback) {
	configUtils.getDefaultConfig(config => {
		var send = {};
		for (var key in config) {
			if (hiddenFields.indexOf(key) >= 0) continue;
			send[key] = config[key];
		}
		callback(send);
	});
}

function exportPages(callback, urls, pages) {
	if(urls === undefined) {
		pageUtils.list(urls => {
			exportPages(callback, urls, []);
		});
		return;
	}
	if (urls.length == 0) {
		return callback(pages);
	}
	var url = urls.shift();
	pageUtils.getTitle(url, title => {
		pageUtils.getConfig(url, config => {
			pageUtils.getContent(url, content => {
				var page = { url: url, title: title, content: content };
				for (var key in config) {
					page[key] = config[key];
				}
				pages.push(page);
				exportPages(callback, urls, pages);
			});
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
