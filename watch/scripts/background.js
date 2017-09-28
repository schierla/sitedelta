var alarmListener = function(alarm) {
    var url = alarm.name;
    console.log("SiteDelta: Scanning " + url);
    pageUtils.getEffectiveConfig(url, function(config) {
        if(config == null) return;
        watchUtils.loadPage(url, function(doc) {
            var newContent = textUtils.getText(doc, config);
            pageUtils.getContent(url, function(oldContent) {
                if(textUtils.clean(newContent, config) != textUtils.clean(oldContent, config)) {
                    pageUtils.getTitle(url, function(title) {
                        chrome.notifications.create(url, {
                            "type": "basic", 
                            "iconUrl": chrome.extension.getURL("common/icons/changed-64.png"),
                            "title": chrome.i18n.getMessage("watchExtensionName"),
                            "message": title
                        });
                    });
                    watchUtils.adaptDelay(url, 1);
                    watchUtils.setChanges(url, 1, () => updateAlarm(url));
                } else {
                    watchUtils.adaptDelay(url, 0);
                    watchUtils.setChanges(url, 0, () => updateAlarm(url));
                }
            });
        });
    });
};

var initAlarms = function() {
    pageUtils.list(function(pages) {
        for(var i=0; i<pages.length; i++) {
            updateAlarm(pages[i]);
        }
    });
}

var nextAllowedAlarm = 0;

var updateAlarm = function(url) {
    pageUtils.getChanges(url, changes => {
        if(changes > 0) return; 
        pageUtils.getNextScan(url,
            (nextScan) => {
                if(nextScan == 0) return;
                if(nextAllowedAlarm < Date.now() + 5000) nextAllowedAlarm = Date.now() + 5000;
                if(nextScan < nextAllowedAlarm) {
                    nextScan = nextAllowedAlarm;
                    nextAllowedAlarm += 5000;
                }
                console.log("SiteDelta: Scheduling scan of " + url + " for " + new Date(nextScan).toLocaleString());
                chrome.alarms.create(url, {"when": nextScan});
            }
        )
    });
}

var removeAlarm = function(url) {
    chrome.alarms.clear(url);
}

var messageListener = function(request, sender, sendResponse) {
    if(request.command == "updateAlarm") {
        updateAlarm(request.url);
    } else if(request.command == "removeAlarm") {
        removeAlarm(request.url);
    } else if(request.command == "openChanged") {
        pageUtils.listChanged(function (urls) {
            for (var i = 0; i < urls.length; i++) {
                tabUtils.openResource("watch/show.htm?" + urls[i]);
            }
        });
    }
};

var notificationListener = function(url) {
    tabUtils.openResource("watch/show.htm?" + url);
}

chrome.runtime.onMessage.addListener(messageListener);
chrome.alarms.onAlarm.addListener(alarmListener);
chrome.notifications.onClicked.addListener(notificationListener);

initAlarms();
watchUtils.showChanges();