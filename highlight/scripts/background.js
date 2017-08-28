chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
	if(details.frameId != 0) return;
	tabController.tabShowIcon(details.tabId, "../common/icons/inactive.svg", function() {});
	chrome.notifications.clear("highlight");
});

chrome.webNavigation.onCompleted.addListener(function(details) {
	if(details.frameId != 0) return;
	pageController.pageGetConfig(details.url, function(config) {
		if(config == null) {
			tabController.tabShowIcon(details.tabId, "../common/icons/neutral.svg", function() {});
		} else {
			pageController.pageGetContent(details.url, function(oldcontent) {
				if(content != null) {
					tabController.tabGetContent(details.tabId, details.url, function(content) {
						if(textUtils.clean(content, config) == textUtils.clean(oldcontent, config)) {
							// unchanged
							tabController.tabShowIcon(details.tabId, "../common/icons/unchanged.svg", function() {});
						} else {
							// changed
							tabController.tabShowIcon(details.tabId, "../common/icons/changed.svg", function() {});
						}
					});
				}
			});
		}
	});
});

chrome.contextMenus.create({
	id: "highlight",
	title: chrome.i18n.getMessage("highlightButtonHighlight"),
	contexts: ["browser_action", "page"]
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if(info.menuItemId == "highlight") {
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
					tabController.tabShowIcon(tab.id, "../common/icons/unchanged.svg", function() {});
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("common/icons/unchanged.svg"),
						"title": chrome.i18n.getMessage("highlightExtensionName"),
						"message": chrome.i18n.getMessage("highlightTitleNoChanges")
					});
				} else {
					tabController.tabShowIcon(tab.id, "../common/icons/changed.svg", function() {});
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("common/icons/changed.svg"),
						"title": chrome.i18n.getMessage("highlightExtensionName"),
						"message": chrome.i18n.getMessage("highlightTitleChanges", [status.current, status.changes])
					});
				}
			});
		});
	}
});

function messageHandler(request, sender, sendResponse) {
    if(request.command == "addIncludeRegion") {
		tabController.tabSelectRegion(request.tab, function(xpath) {
			pageController.pageAddInclude(request.url, xpath);
        });
	} else if(request.command == "addExcludeRegion") {
		tabController.tabSelectRegion(request.tab, function(xpath) {
			pageController.pageAddExclude(request.url, xpath);
		});
	}
}

chrome.runtime.onMessage.addListener(messageHandler);
