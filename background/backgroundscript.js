browser.webNavigation.onCompleted.addListener(function(details) {
	if(details.frameId != 0) return;
	io.get(details.url, function(result) {
		if(result == null) {
			chrome.pageAction.hide(details.tabId);
		} else {
            	chrome.pageAction.show(details.tabId);
			chrome.pageAction.setIcon({path: "../icons/neutral.svg", tabId: details.tabId });
			if("content" in result) {
				chrome.tabs.executeScript(details.tabId, {file: "/content/contentscript.js"}, function(done) {
					chrome.tabs.sendMessage(details.tabId, {command: "getContent", config: result.config}, function(content) {
						if(content == result.content) {
							// unchanged
							chrome.pageAction.setIcon({path: "../icons/unchanged.svg", tabId: details.tabId});
						} else {
							// changed
							chrome.pageAction.setIcon({path: "../icons/changed.svg", tabId: details.tabId});
						}
					});
				});
			}
		}
	});
});

browser.browserAction.setBadgeText({text:"2"});
