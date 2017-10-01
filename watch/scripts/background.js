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
    if (request.command == "openChanged") {
        pageUtils.listChanged(function (urls) {
            for (var i = 0; i < urls.length; i++) {
                tabUtils.openResource("watch/show.htm?" + urls[i]);
            }
        });
    }
};

var notificationListener = function (url) {
    tabUtils.openResource("watch/show.htm?" + url);
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