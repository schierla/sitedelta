chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
	if(details.frameId != 0) return;
	chrome.pageAction.hide(details.tabId);
	chrome.notifications.clear("highlight");

});

chrome.webNavigation.onCompleted.addListener(function(details) {
	if(details.frameId != 0) return;
	pageController.pageGetConfig(SCOPE_HIGHLIGHT, details.url, function(config) {
		if(config == null) {
			tabController.tabHidePageAction(details.tabId, function() {});
		} else {
			tabController.tabShowPageAction(details.tabId, "../icons/neutral.svg", function() {});
			pageController.pageGetContent(SCOPE_HIGHLIGHT, details.url, function(oldcontent) {
				if(content != null) {
					tabController.tabGetContent(SCOPE_HIGHLIGHT, details.tabId, details.url, function(content) {
						if(textUtils.clean(content, config) == textUtils.clean(oldcontent, config)) {
							// unchanged
							tabController.tabShowPageAction(details.tabId, "../icons/unchanged.svg", function() {});
						} else {
							// changed
							tabController.tabShowPageAction(details.tabId, "../icons/changed.svg", function() {});
						}
					});
				}
			});
		}
	});
});

chrome.contextMenus.create({
	id: "highlight",
	title: chrome.i18n.getMessage("pagepopupButtonHighlight"),
	contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if(info.menuItemId == "highlight") {
    	pageController.pageGetOrCreateConfig(SCOPE_HIGHLIGHT, tab.url, tab.title, function() {
			tabController.tabHighlightChanges(SCOPE_HIGHLIGHT, tab.id, tab.url, function(status) {
				if(status.changes == 0) {
					tabController.tabShowPageAction(tab.id, "../icons/unchanged.svg", function() {});				
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("icons/unchanged.svg"),
						"title": chrome.i18n.getMessage("pagepopupButtonHighlight"),
						"message": chrome.i18n.getMessage("pagepopupTitleNoChanges")
					});
				} else {
					tabController.tabShowPageAction(tab.id, "../icons/changed.svg", function() {});
					chrome.notifications.create("highlight", {
						"type": "basic",
						"iconUrl": chrome.extension.getURL("icons/changed.svg"),
						"title": chrome.i18n.getMessage("pagepopupButtonHighlight"),
						"message": chrome.i18n.getMessage("pagepopupTitleChanges", [status.current, status.changes])
					});
				}
			});
		});
	}
});

function messageHandler(request, sender, sendResponse) {
    if(request.command == "addIncludeRegion") {
		tabController.tabSelectRegion(request.tab, function(xpath) {
			pageController.pageAddInclude(SCOPE_HIGHLIGHT, request.url, xpath);
        });
	} else if(request.command == "addExcludeRegion") {
		tabController.tabSelectRegion(request.tab, function(xpath) {
			pageController.pageAddExclude(SCOPE_HIGHLIGHT, request.url, xpath);
		});
	}
}

chrome.runtime.onMessage.addListener(messageHandler);


chrome.browserAction.setBadgeText({text:"2"});
