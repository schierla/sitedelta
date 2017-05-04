chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
	if(details.frameId != 0) return;
	chrome.pageAction.hide(details.tabId);
});

chrome.webNavigation.onCompleted.addListener(function(details) {
	if(details.frameId != 0) return;
	ioUtils.get(details.url, function(result) {
		if(result == null) {
			tabController.tabHidePageAction(details.tabId, function() {});
		} else {
			tabController.tabShowPageAction(details.tabId, "../icons/neutral.svg", function() {});
			if("content" in result) {
				tabController.tabGetContent(details.tabId, details.url, function(content) {
					if(textUtils.clean(content, result.config) == textUtils.clean(result.content, result.config)) {
						// unchanged
						tabController.tabShowPageAction(details.tabId, "../icons/unchanged.svg", function() {});
					} else {
						// changed
						tabController.tabShowPageAction(details.tabId, "../icons/changed.svg", function() {});
					}
				});
			}
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
    	pageController.pageGetOrCreate(tab.url, tab.title, function() {
			tabController.tabHighlightChanges(tab.id, tab.url, function(status) {
				if(status.changes == 0) {
					tabController.tabShowPageAction(tab.id, "../icons/unchanged.svg", function() {});				
				} else {
					tabController.tabShowPageAction(tab.id, "../icons/changed.svg", function() {});
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


chrome.browserAction.setBadgeText({text:"2"});
