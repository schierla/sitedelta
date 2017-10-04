function scanPage(url, callback) {
	console.log("SiteDelta: Scanning " + url);
	lastScan = Date.now();
	pageUtils.getEffectiveConfig(url, function (config) {
		if (config === null) {
			return (callback !== undefined) ? callback() : null;
		}
		watchUtils.loadPage(url, function (doc) {
			if (doc === null) {
				return watchUtils.setChanges(url, -1, callback);
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
					return (callback !== undefined) ? callback() : null;
				} else {
					watchUtils.adaptDelay(url, 0);
					watchUtils.setChanges(url, 0);
					return (callback !== undefined) ? callback() : null;
				}
			});
		});
	});
}

var messageListener = function (request, sender, sendResponse) {
	var hiddenFields = ["configVersion", "includes", "excludes", "scanOnLoad", "highlightOnLoad", "enableContextMenu"];
	if (request.command == "openChanged") {
		pageUtils.listChanged(function (urls) {
			for (var i = 0; i < urls.length; i++) {
				tabUtils.openResource("show.htm?" + urls[i]);
			}
		});
	} else if (request.command == "transferInfo") {
		sendResponse({ name: "SiteDelta Watch", id: "sitedelta-watch", import: ["config", "pages"], export: ["config", "pages"] });
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


var notificationListener = function (url) {
	tabUtils.openResource("show.htm?" + url);
}

var index = {};
var lastScan = 0;

function scheduleWatch() {
	var nextUrl = "";
	var changed = 0;
	for (var url in index) {
		if ("changes" in index[url] && index[url].changes > 0) changed++;
		if (!("nextScan" in index[url]) || index[url].nextScan == 0) continue;
		if (nextUrl == "" || index[nextUrl].nextScan > index[url].nextScan) nextUrl = url;
	}

	if (nextUrl == "") return;
	var nextScan = index[nextUrl].nextScan;
	if (nextScan < lastScan + 5000) nextScan = lastScan + 5000;
	console.log("SiteDelta: Scheduled " + nextUrl + " for " + new Date(nextScan).toLocaleString());
	if (nextScan <= Date.now()) {
		scanPage(nextUrl);
	} else {
		chrome.alarms.create({ "when": nextScan });
	}

	if (changed > 0)
		chrome.browserAction.setBadgeText({ text: "" + changed });
	else
		chrome.browserAction.setBadgeText({ text: "" });
}

ioUtils.observeIndex(newIndex => { index = newIndex; scheduleWatch(); });
chrome.alarms.onAlarm.addListener(scheduleWatch);

chrome.runtime.onMessage.addListener(messageListener);
chrome.notifications.onClicked.addListener(notificationListener);
