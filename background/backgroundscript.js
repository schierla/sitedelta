chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
	if(details.frameId != 0) return;
	chrome.pageAction.hide(details.tabId);
});

chrome.webNavigation.onCompleted.addListener(function(details) {
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
						if(_clean(content, result.config) == _clean(result.content, result.config)) {
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

function _clean(text, config) {
	if (config.ignoreCase)
		text = text.toLowerCase();
	if (config.ignoreNumbers)
		text = text.replace(/[0-9]+/g, "xxx");
	return text;
}

function messageHandler(request, sender, sendResponse) {
    if(request.command == "addIncludeRegion") {
		chrome.tabs.executeScript(request.tab, {file: "/content/contentscript.js"}, function(done) {
			chrome.tabs.sendMessage(request.tab, {command: "selectRegion"}, function(xpath) {
				io.get(request.url, function(data) {
					data.config.includes.push(xpath);
					io.put(request.url, data);
				});
			});
        });
	} else if(request.command == "addExcludeRegion") {
		chrome.tabs.executeScript(request.tab, {file: "/content/contentscript.js"}, function(done) {
			chrome.tabs.sendMessage(request.tab, {command: "selectRegion"}, function(xpath) {
				io.get(request.url, function(data) {
					data.config.excludes.push(xpath);
					io.put(request.url, data);
				});
			});
        });
	}
}

chrome.runtime.onMessage.addListener(messageHandler);


chrome.browserAction.setBadgeText({text:"2"});
