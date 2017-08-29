
var webNavigationBeforeListener = function(details) {
	if(details.frameId != 0) return;
	tabController.tabShowIcon(details.tabId, "inactive", function() {});
	if(chrome.notifications) chrome.notifications.clear("highlight");
};

var webNavigationCompletedListener = function(details) {
	if(details.frameId != 0) return;
	pageController.pageGetConfig(details.url, function(config) {
		if(config == null) {
			tabController.tabShowIcon(details.tabId, "neutral", function() {});
		} else {
			pageController.pageGetContent(details.url, function(oldcontent) {
				if(oldcontent != null) {
					tabController.tabGetContent(details.tabId, details.url, function(content) {
						if(textUtils.clean(content, config) == textUtils.clean(oldcontent, config)) {
							// unchanged
							tabController.tabShowIcon(details.tabId, "unchanged", function() {});
						} else {
							// changed
							tabController.tabShowIcon(details.tabId, "changed", function() {});
						}
					});
				}
			});
		}
	});
};


var menuHighlightPage = {
	id: "highlightPage",
	title: chrome.i18n.getMessage("highlightButtonHighlight"),
	documentUrlPatterns: ["http://*/*", "https://*/*"],		
	contexts: ["page"]
};

var menuHighlight = {
	id: "highlight",
	title: chrome.i18n.getMessage("highlightButtonHighlight"),
	contexts: ["browser_action"]
};

var menuOptions = {
	id: "options",
	title: chrome.i18n.getMessage("highlightButtonOptions"),
	contexts: ["browser_action"]
};

var contextMenuListener = function(info, tab) {
	if(info.menuItemId == menuHighlight.id || info.menuItemId == menuHighlightPage.id) {
		if(tab.url.substr(0,4)!="http") {
			chrome.notifications.create("highlight", {
				"type": "basic",
				"iconUrl": chrome.extension.getURL("common/icons/inactive.svg"),
				"title": chrome.i18n.getMessage("highlightExtensionName"),
				"message": chrome.i18n.getMessage("highlightTitleUnavailable")
			});
			return;
		}
		pageController.pageGetOrCreateConfig(tab.url, tab.title, function() {
			tabController.tabHighlightChanges(tab.id, tab.url, function(status) {
				if(status.changes == 0) {
					tabController.tabShowIcon(tab.id, "unchanged", function() {});
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("common/icons/unchanged.svg"),
						"title": chrome.i18n.getMessage("highlightExtensionName"),
						"message": chrome.i18n.getMessage("highlightTitleNoChanges")
					});
				} else {
					tabController.tabShowIcon(tab.id, "changed", function() {});
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("common/icons/changed.svg"),
						"title": chrome.i18n.getMessage("highlightExtensionName"),
						"message": chrome.i18n.getMessage("highlightTitleChanges", [status.current, status.changes])
					});
				}
			});
		});
	} else if(info.menuItemId == menuOptions.id) {
		chrome.runtime.openOptionsPage();
	}
};

var messageListener = function(request, sender, sendResponse) {
    if(request.command == "addIncludeRegion") {
		tabController.tabSelectRegion(request.tab, function(xpath) {
			pageController.pageAddInclude(request.url, xpath);
        });
	} else if(request.command == "addExcludeRegion") {
		tabController.tabSelectRegion(request.tab, function(xpath) {
			pageController.pageAddExclude(request.url, xpath);
		});
	} else if(request.command == "reinitialize") {
		initialize();
	}
};


function initialize() {

	chrome.permissions.contains({permissions:["webNavigation"]}, function(supported) {
		if(supported) {
			chrome.webNavigation.onBeforeNavigate.removeListener(webNavigationBeforeListener);
			chrome.webNavigation.onCompleted.removeListener(webNavigationCompletedListener);

			chrome.webNavigation.onBeforeNavigate.addListener(webNavigationBeforeListener);
			chrome.webNavigation.onCompleted.addListener(webNavigationCompletedListener);
		}
	});
	
	chrome.permissions.contains({permissions:["contextMenus"]}, function(supported) {
		if(supported) {
			chrome.contextMenus.onClicked.removeListener(contextMenuListener);
			chrome.contextMenus.removeAll(function() {
				chrome.contextMenus.create(menuHighlightPage);
				chrome.contextMenus.create(menuHighlight);
				chrome.contextMenus.create(menuOptions);
				chrome.contextMenus.onClicked.addListener(contextMenuListener);
			});
		}
	});

	chrome.runtime.onMessage.removeListener(messageListener);
	chrome.runtime.onMessage.addListener(messageListener);
}

initialize();
