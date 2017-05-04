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

function _clean(text, config) {
	if (config.ignoreCase)
		text = text.toLowerCase();
	if (config.ignoreNumbers)
		text = text.replace(/[0-9]+/g, "xxx");
	return text;
}

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
