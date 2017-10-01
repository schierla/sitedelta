function scanPage(url, callback) {
    console.log("SiteDelta: Scanning " + url);
    lastScan = Date.now();
    pageUtils.getEffectiveConfig(url, function (config) {
        if (config === null) {
            if (callback !== undefined) callback();
            return;
        }
        watchUtils.loadPage(url, function (doc) {
            if (doc === null) {
                watchUtils.setChanges(url, -1, callback);
                return;
            }
            var newContent = textUtils.getText(doc, config);
            pageUtils.getContent(url, function (oldContent) {
                if (textUtils.clean(newContent, config) != textUtils.clean(oldContent, config)) {
                    pageUtils.getTitle(url, function (title) {
                        chrome.notifications.create(url, {
                            "type": "basic",
                            "iconUrl": chrome.extension.getURL("common/icons/changed-64.png"),
                            "title": chrome.i18n.getMessage("watchExtensionName"),
                            "message": title
                        });
                    });
                    watchUtils.adaptDelay(url, 1);
                    watchUtils.setChanges(url, 1);
                    if (callback !== undefined) callback();
                } else {
                    watchUtils.adaptDelay(url, 0);
                    watchUtils.setChanges(url, 0);
                    if (callback !== undefined) callback();
                }
            });
        });
    });
}

var messageListener = function (request, sender, sendResponse) {
    var hiddenConfig = ["configVersion","includes","excludes","scanOnLoad","highlightOnLoad","enableContextMenu"];
    if (request.command == "openChanged") {
        pageUtils.listChanged(function (urls) {
            for (var i = 0; i < urls.length; i++) {
                tabUtils.openResource("show.htm?" + urls[i]);
            }
        });
    } else if(request.command == "transferCaps") {
		sendResponse({name: "SiteDelta Watch", id: "sitedelta-watch", import: ["config"], export: ["config", "pages"]});
	} else if(request.command == "transferImport") {
		if(request.scope == "config") {
			configUtils.getDefaultConfig(config => {
				var update = {};
				var newConfig = JSON.parse(request.data);
				for(var key in newConfig) {
                    if(hiddenConfig.indexOf(key) >= 0) continue;
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
					if(hiddenConfig.indexOf(key) >= 0) continue;
					send[key] = config[key];
				}
				sendResponse(JSON.stringify(send, null, "  "))
			});
			return true;
		} else if(request.scope == "pages") {
			pageUtils.list((urls) => {
				collectPages(urls, [],  pages => {
					sendResponse(JSON.stringify(pages, null, "  "));
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
            pageUtils.getContent(url, content => {
                var page = {url: url, title: title, content: content};
                for(var key in config) {
                    page[key] = config[key];
                }
                pages.push(page);
                collectPages(urls, pages, callback);
            });
		});
	});
}


var notificationListener = function (url) {
    tabUtils.openResource("show.htm?" + url);
}

var index = {};
var lastScan = 0;

function scheduleWatch() {
    var nextUrl = "";
    for (var url in index) {
        if (index[url].nextScan == 0) continue;
        if (nextUrl == "" || index[nextUrl].nextScan > index[url].nextScan) nextUrl = url;
    }

    if (nextUrl == "") return;
    var nextScan = index[nextUrl].nextScan;
    if (nextScan < lastScan + 5000) nextScan = lastScan + 5000;
    if (nextScan <= Date.now()) {
        scanPage(nextUrl);
    } else {
        chrome.alarms.create({ "when": nextScan });
    }

    watchUtils.showChanges();
}

ioUtils.observeIndex(newIndex => { index = newIndex; scheduleWatch(); });
chrome.alarms.onAlarm.addListener(scheduleWatch);

chrome.runtime.onMessage.addListener(messageListener);
chrome.notifications.onClicked.addListener(notificationListener);

watchUtils.showChanges();