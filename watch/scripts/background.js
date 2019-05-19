function scanPage(url, callback) {
	configUtils.getDefaultConfig(config => {
		console.log("SiteDelta: Scanning " + url);
		lastScan = Date.now();
		watchUtils.scanPage(url, changes => {
			if(changes == 0) {
				watchUtils.adaptDelay(url, 0);
			} else if(changes == 1) {
				if(config.notifyChanged) {
					pageUtils.getTitle(url, function (title) {
						chrome.notifications.create(url, {
							"type": "basic",
							"iconUrl": chrome.extension.getURL("common/icons/changed.svg"),
							"title": chrome.i18n.getMessage("watchNotificationChanged"),
							"message": title
						});
					});
				}
				watchUtils.adaptDelay(url, 1);
			} else if(changes == -1) {
				if(config.notifyFailed) {
					pageUtils.getTitle(url, function (title) {
						chrome.notifications.create(url, {
							"type": "basic",
							"iconUrl": chrome.extension.getURL("common/icons/inactive.svg"),
							"title": chrome.i18n.getMessage("watchNotificationFailed"),
							"message": title
						});
					});
				}
			}
			return (callback !== undefined) ? callback() : null;
		});
	});
}

function openPages(pages) {
	if(pages.length == 0) return;
	var url = pages.shift();
	tabUtils.openResource("show.htm?" + url);
	setTimeout(() => openPagesInBackground(pages), 300);
}

function openPagesInBackground(pages) {
	if(pages.length == 0) return;
	var url = pages.shift();
	tabUtils.openResourceInBackground("show.htm?" + url);
	setTimeout(() => openPagesInBackground(pages), 300);
}

function scanPages(pages) {
	if(pages.length == 0) return;
	var url = pages.shift();
	scanPage(url, () => scanPages(pages));
}

var messageListener = function (request, sender, sendResponse) {
	var hiddenFields = ["configVersion", "includes", "excludes", "scanOnLoad", "highlightOnLoad", "enableContextMenu"];
	if (request.command == "openChanged") {
		pageUtils.listChanged(function (urls) {
			openPages(urls);
		});
	} else if(request.command == "scanAll") {
		pageUtils.list(function (urls) {
			scanPages(urls);
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
