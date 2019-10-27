namespace watchBackground {

	async function scanPage(url: string): Promise<void> {
		var config = await configUtils.getDefaultConfig();
		console.log("SiteDelta: Scanning " + url);
		lastScan = Date.now();
		var changes = await watchUtils.scanPage(url);
		if(changes == 0) {
			await watchUtils.adaptDelay(url, 0);
		} else if(changes == 1) {
			if(config.notifyChanged) {
				var title = await pageUtils.getTitle(url);
				chrome.notifications.create(url, {
					"type": "basic",
					"iconUrl": chrome.extension.getURL("common/icons/changed.svg"),
					"title": chrome.i18n.getMessage("watchNotificationChanged"),
					"message": title || ""
				});
			}
			await watchUtils.adaptDelay(url, 1);
		} else if(changes == -1) {
			if(config.notifyFailed) {
				var title = await pageUtils.getTitle(url);
				chrome.notifications.create(url, {
					"type": "basic",
					"iconUrl": chrome.extension.getURL("common/icons/inactive.svg"),
					"title": chrome.i18n.getMessage("watchNotificationFailed"),
					"message": title || ""
				});
			}
		}
	}

	async function openPages(pages: string[]): Promise<void> {
		for(var i=0; i<pages.length; i++) {
			if(i==0) 
				await tabUtils.openResource("show.htm?" + pages[i]);
			else 
				await tabUtils.openResourceInBackground("show.htm?" + pages[i]);
			await new Promise(resolve => setTimeout(resolve, 300));
		}
	}

	async function scanPages(pages: string[]): Promise<void> {
		for(var i=0; i<pages.length; i++) {
			await scanPage(pages[i]);
		}
		var changed = await pageUtils.listChanged(), failed = await pageUtils.listFailed();
		if(changed.length == 0 && failed.length == 0) {
			var config = await configUtils.getDefaultConfig();
			if(config.notifyChanged) {
				chrome.notifications.create("#", {
					"type": "basic",
					"iconUrl": chrome.extension.getURL("common/icons/unchanged.svg"),
					"title": chrome.i18n.getMessage("watchNotificationUnchanged"),
					"message": ""
				});
			}
		}
	}

	var messageListener = function (request: any, sender: any, sendResponse: (response: any) => void) {
		var hiddenFields = ["configVersion", "includes", "excludes", "scanOnLoad", "highlightOnLoad", "enableContextMenu"];
		if (request.command == "openChanged") {
			pageUtils.listChanged().then(openPages);
		} else if (request.command == "openFailed") {
			pageUtils.listFailed().then(openPages);
		} else if(request.command == "scanAll") {
			pageUtils.list().then(scanPages);
		} else if (request.command == "transferInfo") {
			sendResponse({ name: "SiteDelta Watch", id: "sitedelta-watch", import: ["config", "pages"], export: ["config", "pages"] });
		} else if (request.command == "transferImport") {
			if (request.scope == "config") {
				try {
					var config = JSON.parse(request.data);
					var result = transferUtils.importConfig(config, hiddenFields).then(result => 
						sendResponse("Configuration import completed: \n" + result.imported + " imported, " + result.skipped + " skipped")
					);
				} catch (e) {
					sendResponse("Configuration import failed: \n" + e);
				}
			} else if (request.scope == "pages") {
				try {
					var pages = JSON.parse(request.data);
					transferUtils.importPages(pages).then(result => 
						sendResponse("Page import completed: \n" + result.imported + " imported, " + result.skipped + " skipped")
					);
				} catch (e) {
					sendResponse("Page import failed: \n" + e);
				}
			}
			return true;
		} else if (request.command == "transferExport") {
			if (request.scope == "config") {
				transferUtils.exportConfig(hiddenFields).then(config =>
					sendResponse(JSON.stringify(config, null, "  "))
				);
			} else if (request.scope == "pages") {
				transferUtils.exportPages().then(pages => 
					sendResponse(JSON.stringify(pages, null, "  "))
				);
			}
			return true;
		}
	};


	var notificationListener = function (url: string): void {
		if(url != "#") tabUtils.openResource("show.htm?" + url);
	}

	var index = {};
	var lastScan = 0;

	function scheduleWatch(): void {
		var nextUrl = "";
		var changed = 0, failed = 0;
		for (var url in index) {
			if ("changes" in index[url] && index[url].changes > 0) changed++;
			if ("changes" in index[url] && index[url].changes < 0) failed++;
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
			chrome.browserAction.setBadgeText({ text: "" + changed + ((failed > 0) ? "*" : "") });
		else
			chrome.browserAction.setBadgeText({ text: "" + ((failed > 0) ? "*" : "") });
	}

	export function initialize() {
		ioUtils.observeIndex(newIndex => { index = newIndex; scheduleWatch(); });
		chrome.alarms.onAlarm.addListener(scheduleWatch);

		chrome.runtime.onMessage.addListener(messageListener);
		chrome.notifications.onClicked.addListener(notificationListener);
	}
}

watchBackground.initialize();